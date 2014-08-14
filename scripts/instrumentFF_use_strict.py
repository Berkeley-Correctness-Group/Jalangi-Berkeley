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
## When calling this script, the current working directory must be Jalangi-Berkeley.

print("instrumentFF.py called with: %s " % str(sys.argv))

valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)

# paths and directories
jalangiBerkeleyBaseDir = os.getcwd()+"/";
workingDirName = jalangiBerkeleyBaseDir+"instrumentFF_tmp/"

## URLs to include
included = [ r'127.0.0.1', r'^http' ]
# .js files to exclude (e.g., libraries)
excluded = [ r'jquery', r'mootools', r'bootstrap', r'peg-0.6.2', r'date.js', r'less-1.2.0', r'interactions.js', r'yui', r'tinymce' ]
#excluded = [ ]


## functions
def checkUsage():
  if (len(sys.argv) < 2 or
      (sys.argv[1] == "--checkURL" and len(sys.argv) != 3) or
      (sys.argv[1] == "--firstTime" and len(sys.argv) != 5) or
      (sys.argv[1] != "--checkURL") and sys.argv[1] != "--firstTime" and len(sys.argv) != 4):
    printHelp()
    sys.exit(-1)

def printHelp():
  print "Usage: instrumentFF --checkURL URL"
  print "       instrumentFF [--firstTime] input.js output.js originalFileName.js"

def checkURL(url):
  for incl in included:
    if re.search(incl, url):
      sys.exit(0)
  sys.exit(1)

def instrument():
  args = sys.argv[:]
  firstTime = False
  if sys.argv[1] == "--firstTime":
    firstTime = True
    args.remove("--firstTime")
  tmpOrig = args[1]
  tmpInstr = args[2]
  rawRealFileName = args[3]
  
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
      shutil.copyfile(tmpOrig, tmpInstr)
      sys.exit(0)
  
  cmd = [ "cat", "/tmp/us.js", tmpOrig]
  f = open(tmpInstr,"wb")
  subprocess.call(cmd,stdout=f)
  f.close()


def makeUniqueFileName(realFileName, workingDir):
  candidate = realFileName
  i = 1
  while os.path.exists(os.path.join(workingDir, candidate)):
    candidate = re.sub(r'\.js$', `i`+".js", realFileName)
    i = i+1
  return candidate

## main part
checkUsage()
if sys.argv[1] == "--checkURL":
  checkURL(sys.argv[2])
else:
  instrument()
