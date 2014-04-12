#
# Copyright 2014 University of California, Berkeley.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#		http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Author: Michael Pradel

import os
import sys
import tempfile
import shutil
import string
import subprocess
import fnmatch
import re

## This script is called from a modified version of Firefox.
## It instruments .js files for in-browser analysis with Jalangi.

# parameters
jalangiBerkeleyBaseDir = "/home/m/research/projects/Jalangi-Berkeley/"
jalangiBaseDir = "/home/m/research/projects/jalangi/"

#excluded = [ r'jquery', r'iscroll', r'peg-0.6.2', r'String.js', r'jsviews' ]
excluded = [ r'jquery' ]

workingDirName = "/tmp/jalangiWorkingDir/"

#jalangiAnalysisFiles = [
#    jalangiBerkeleyBaseDir+"src/js/analyses/executionCounters/ExecutionCountersEngine.js" ]
#jalangiAnalysis = jalangiBerkeleyBaseDir+"src/js/analyses/typeCoercion/TypeAnalysisEngine.js"
#jalangiAnalysis = jalangiBerkeleyBaseDir+"src/js/analyses/typeCoercion/TypeAnalysisEngine2.js"
jalangiAnalysisFiles = [ 
   jalangiBerkeleyBaseDir+"src/js/analyses/CommonUtil.js",
   jalangiBerkeleyBaseDir+"src/js/analyses/inconsistentType/TypeAnalysis.js",
   jalangiBerkeleyBaseDir+"src/js/analyses/inconsistentType/InconsistentTypeEngine.js" ]

#jalangiAnalysis = jalangiBaseDir+"src/js/analyses/logundefinedread/logUndefinedRead.js"

# constants
jalangiSuffix = "_jalangi_.js"
valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
jalangiLibs = [
    "src/js/Constants.js",
    "src/js/Config.js",
    "src/js/Globals.js",
    "src/js/SMemory.js",
    "src/js/iidToLocation.js",
    "src/js/RecordReplayEngine.js",
    "src/js/analysis.js",
    "src/js/InputManager.js"
    ]

print("instrument.py called with: %s " % str(sys.argv))

# read arguments
tmpOrig = sys.argv[1]
tmpInstr = sys.argv[2]
rawRealFileName = sys.argv[3]
libOption = sys.argv[4]
instrCodeOption = sys.argv[5]

# don't instrument eval() code (Jalangi is taking care of it)
#if instrCodeOption == "instrumentCode":
#  print "Ignoring eval() code for instrumentation..."
#  shutil.copyfile(tmpOrig, tmpInstr)
#  sys.exit(0)

# functions
def makeUniqueFileName():
  candidate = realFileName
  i = 1
  while os.path.exists(os.path.join(workingDir, candidate)):
    candidate = re.sub(r'\.js$', `i`+".js", realFileName)
    i = i+1
  return candidate

def findCachedFile():
  # disable caching while the analysis changes all the time (or delete instrumented files after each change)
  #return None
  print "Searching cached file for "+realFileName
  for file in os.listdir(workingDir):
    filePattern = re.sub(r'\.js$', "", realFileName)+"*"+".js"
    if fnmatch.fnmatch(file, filePattern):
      path = os.path.join(workingDir, file)
      cmpReturn = subprocess.call(["cmp", "--silent", tmpOrig, path]);
      if cmpReturn == 0:
        return path
  print ".. Nothing found"
  return None

# main part
realFileName = ''.join(c for c in rawRealFileName if c in valid_chars)
realFileName = realFileName[0:100] # truncate long names

workingDir = os.path.dirname(workingDirName)
if not os.path.exists(workingDir): 
  os.makedirs(workingDir)

if not realFileName.endswith(".js"):
  realFileName = realFileName+".js"

# optionally, exclude some files, e.g., complex libraries
for ex in excluded:
  if re.search(ex, realFileName):
    print "Will not instrument "+realFileName
    if libOption == "jalangiLibs":
      print " .. but will add jalangi libs"
      f = open(tmpInstr, 'w')
      f.write("// START OF JALANGI LIBS\n\n")
      f.write(open(jalangiBerkeleyBaseDir+"src/js/analyses/InitDirectAnalysis.js").read())
      for jalangiLib in jalangiLibs:
        f.write(open(jalangiBaseDir+jalangiLib).read())
      for jalangiAnalysisFile in jalangiAnalysisFiles:
        f.write(open(jalangiAnalysisFile).read())
      f.write("\n\n// END OF JALANGI LIBS\n\n")
      f.write(open(tmpOrig).read()) 
      f.close()
    else:
      shutil.copyfile(tmpOrig, tmpInstr)
    sys.exit(0)

# short cut: use cached file if we already instrumented it
cachedOrigFile = findCachedFile()
if cachedOrigFile != None:
  cachedInstrFile = re.sub(r'\.js$', jalangiSuffix, cachedOrigFile)
  if libOption == "jalangiLibs":
    cachedInstrFile = cachedInstrFile+"_withJalangiLibs"
  if os.path.exists(cachedInstrFile):
    shutil.copyfile(cachedInstrFile, tmpInstr);
    print "Reusing cached file "+cachedInstrFile
    sys.exit(0)

uniqueFileName = makeUniqueFileName()
orig = os.path.join(workingDir, uniqueFileName)

shutil.copyfile(tmpOrig, orig)

#if instrCodeOption == "instrumentCode":
#  cmd = ["node", "/home/m/research/projects/jalangi/src/js/instrument/esnstrument.js", "--instrumentCode", orig]
#else:
cmd = [ "node", "/home/m/research/projects/jalangi/src/js/instrument/esnstrument.js", "--iidsFile", workingDirName+"iids.json", "--noEvalWrap", orig ]
print "Calling instrumenter with\n"+' '.join(cmd)
subprocess.call(cmd)

instr = re.sub(r'\.js$', jalangiSuffix, orig)

# result file
f = open(tmpInstr, 'w')
# add jalangi libs (if needed)
if libOption == "jalangiLibs":
  f.write("// START OF JALANGI LIBS\n\n")
  f.write(open(jalangiBerkeleyBaseDir+"src/js/analyses/InitDirectAnalysis.js").read())
  for jalangiLib in jalangiLibs:
    f.write(open(jalangiBaseDir+jalangiLib).read())
  for jalangiAnalysisFile in jalangiAnalysisFiles:
    f.write(open(jalangiAnalysisFile).read())
  f.write("\n\n// END OF JALANGI LIBS\n\n")
# add iid infos
f.write("var iidInfos = "+open(workingDirName+"/iids.json").read()+";\nJ$.iids = iidInfos.iids;\n\n") 
# add instrumented code  
f.write(open(instr).read()) 
f.close()
  
if libOption == "jalangiLibs":
  shutil.copyfile(tmpInstr, instr+"_withJalangiLibs")

if not instrCodeOption == "instrumentCode":
  shutil.move("jalangi_sourcemap.js", os.path.join(workingDir, uniqueFileName+"_jalangi_sourcemap.js"))
