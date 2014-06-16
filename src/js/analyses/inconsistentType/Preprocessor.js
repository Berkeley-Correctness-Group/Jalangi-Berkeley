/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    var fs = require('fs');
    var esprima = require('esprima');
    var escodegen = require('escodegen');

    var beliefPrefix = "ITA_Belief: ";
    var beliefInfix = " has type ";

    function tagBeliefs(code) {
        try {
            var ast = esprima.parse(code, {loc:true, range:true, comment:true, tokens:true});
        } catch (e) {
            console.log("\nPreprocessor: Error when parsing " + fileName + ". Will ignore this file.\n" + e);
            return code;
        }
        ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
        traverse(ast, preVisitor, postVisitor);
        insertionsToMake.forEach(function(insertation) {
            if (insertation.fct) {
                insertation.fct.body.body.splice(0, 0, insertation.stmt);
            } else {
                ast.body.splice(0, 0, insertation.stmt);
            }
        });

        var transformedCode = escodegen.generate(ast, {comment:true});
        return transformedCode;
    }

    // Executes visitor on the object and its children (recursively).
    function traverse(object, preVisitor, postVisitor) {
        var key, child;

        if (preVisitor.call(null, object) === false) {
            return;
        }
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                if (typeof child === 'object' && child !== null) {
                    traverse(child, preVisitor, postVisitor);
                }
            }
        }
        postVisitor.call(null, object);
    }

    var functionStack = [];
    var insertionsToMake = [];

    function preVisitor(node) {
        if (node.type === "FunctionDeclaration" ||
              node.type === "FunctionExpression") {
            functionStack.push(node);
        } else if (node.type === "IfStatement" ||
              node.type === "WhileStatement" ||
              node.type === "DoWhileStatement" ||
              node.type === "ConditionalExpression") {
            visitConditionalStatement(node);
        } else if (node.type === "VariableDeclaration") {
            visitVariableDeclaration(node);
        } else if (node.type === "AssignmentExpression") {
            visitAssignmentExpression(node);
        } else if (node.type === "LogicalExpression") {
            visitLogicalExpression(node);
        } else if (node.type === "BinaryExpression") {
            visitBinaryExpression(node);
        } else if (node.type === "UnaryExpression") {
            visitUnaryExpression(node);
        }
    }

    function postVisitor(node) {
        if (node.type === "FunctionDeclaration" ||
              node.type === "FunctionExpression") {
            functionStack.pop();
        }
    }

    function visitBinaryExpression(binExpr) {
        if ((binExpr.left.type === "Identifier" && binExpr.right.type === "Literal")) {   // e.g., "if (x===null) .." and "typeof x === 'undefined' ? [] : x"
            createConditionalBeliefIdentifierAndLiteral(binExpr.left, binExpr.right.value, binExpr.operator);
        } else if (binExpr.left.type === "Identifier" && binExpr.right.type === "Identifier" && binExpr.right.name === "undefined") {
            createConditionalBeliefIdentifierAndLiteral(binExpr.left, "undefined", binExpr.operator);
        } else if (binExpr.left.type === "Literal" && binExpr.right.type === "Identifier") {
            createConditionalBeliefIdentifierAndLiteral(binExpr.right, binExpr.left.value, binExpr.operator);
        } else if (binExpr.left.type === "Identifier" && binExpr.left.name === "undefined" && binExpr.right.type === "Identifier") {
            createConditionalBeliefIdentifierAndLiteral(binExpr.right, "undefined", binExpr.operator);
        } else if (binExpr.left.type === "Literal" && isTypeNameLiteral(binExpr.left) &&
              binExpr.right.type === "UnaryExpression" && binExpr.right.operator === "typeof" && binExpr.right.argument.type === "Identifier") {
            createConditionalBeliefTypeOf(binExpr.right.argument.name, binExpr.left.value);
        } else if (binExpr.right.type === "Literal" && isTypeNameLiteral(binExpr.right) &&
              binExpr.left.type === "UnaryExpression" && binExpr.left.operator === "typeof" && binExpr.left.argument.type === "Identifier") {
            createConditionalBeliefTypeOf(binExpr.left.argument.name, binExpr.right.value);
        }
    }
    
    function visitUnaryExpression(unExpr) {
        if (unExpr.operator === "!" && unExpr.argument.type === "Identifier") {  // e.g., "!x"
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(unExpr.argument.name, "undefined")});
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(unExpr.argument.name, "null")});
        }
    }

    function visitConditionalStatement(node) {
        if (node.test.type === "Identifier") {
            createConditionalBeliefIdentifier(node.test);
        }
    }

    function visitVariableDeclaration(declarationNode) {
        declarationNode.declarations.forEach(function(declaration) {
            if (declaration.id.type === "Identifier" && declaration.init) {
                createAssignmentBelief(declaration.id.name, declaration.init);
            }
        });
    }

    function visitAssignmentExpression(assignmentNode) {
        if (assignmentNode.left.type === "Identifier" && assignmentNode.left.name !== "undefined") {
            createAssignmentBelief(assignmentNode.left.name, assignmentNode.right);
        }
    }

    function createAssignmentBelief(varName, rhs) {
        if (rhs.type === "Literal" && rhs.value === null) {   // e.g., "x = null" and "x = undefined"
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(varName, "null")});
        } else if (rhs.type === "Identifier" && rhs.name === "undefined") {
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(varName, "undefined")});
        } else if (rhs.type === "LogicalExpression" && rhs.operator === "||" && rhs.left.type === "Identifier") { // e.g., "x = y || z"
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(rhs.left.name, "undefined")});
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(rhs.left.name, "null")});
            
        }
    }

    function visitLogicalExpression(exprNode) {
        if (exprNode.operator === "||") {    // e.g., "x || {}" and "x || []"
            if (exprNode.right.type === "Identifier" &&
                  ((exprNode.left.type === "ArrayExpression" && exprNode.left.elements.length === 0) ||
                        (exprNode.left.type === "ObjectExpression" && exprNode.left.properties.length === 0))) {
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.right.name, "undefined")});
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.right.name, "null")});
            } else if (exprNode.left.type === "Identifier" &&
                  ((exprNode.right.type === "ArrayExpression" && exprNode.right.elements.length === 0) ||
                        (exprNode.right.type === "ObjectExpression" && exprNode.right.properties.length === 0))) {
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.left.name, "undefined")});
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.left.name, "null")});
            }
        } else if (exprNode.operator === "&&") { // e.g., "x && x.foo ===23"
            if (exprNode.left.type === "Identifier") {
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.left.name, "undefined")});
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.left.name, "null")});
            }
            if (exprNode.right.type === "Identifier") {
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.right.name, "undefined")});
                insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(exprNode.right.name, "null")});
            }
        }
    }

    function createConditionalBeliefIdentifierAndLiteral(identifierNode, literal, operator) {
        if (literal === null)
            literal = "null";
        if (literal === undefined)
            literal = "undefined";
        if ((operator === "===" || operator === "!==") && (literal === "undefined" || literal === "null")) {
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(identifierNode.name, literal)});
        }
        if ((operator === "==" || operator === "!=") && (literal === "undefined" || literal === "null")) {
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(identifierNode.name, "null")});
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(identifierNode.name, "undefined")});
        }
    }

    function createConditionalBeliefIdentifier(identifierNode) {
        if (identifierNode.name !== "null" && identifierNode !== "undefined") {
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(identifierNode.name, "null")});
            insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(identifierNode.name, "undefined")});
        }
    }

    function createConditionalBeliefTypeOf(varName, typeName) {
        insertionsToMake.push({fct:functionStack[functionStack.length - 1], stmt:freshBeliefStmt(varName, typeName)});
    }

    function isTypeNameLiteral(literal) {
        var v = literal.value;
        return v === "object" || v === "string" || v === "number" || v === "boolean" || v === "function" || v === "undefined";
    }

    function freshBeliefStmt(varName, type) {
        var str = beliefPrefix + varName + beliefInfix + type;
        return esprima.parse("\"" + str + "\"").body[0];
    }


    // main part
    var fileName = process.argv[2];
    var newFileName = process.argv[3];
    var code = fs.readFileSync(fileName, "utf8");
    var processedCode = tagBeliefs(code);
    fs.writeFileSync(newFileName, processedCode, "utf8");



})();