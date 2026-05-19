+++
title = 'Claudeでどうでもいいコマンドを全て許可する'
date = 2026-05-19T15:02:00+09:00
draft = false
categories = []
tags = []
image = ''
description = ''
ogpImage = ''
+++

./.claude/settings.json\
にこいつを突っ込む\
 
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "LS",
      "WebFetch",
      "WebSearch",
      "Task",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(less:*)",
      "Bash(more:*)",
      "Bash(find:*)",
      "Bash(which:*)",
      "Bash(whereis:*)",
      "Bash(file:*)",
      "Bash(stat:*)",
      "Bash(du:*)",
      "Bash(df:*)",
      "Bash(pwd)",
      "Bash(whoami)",
      "Bash(uname:*)",
      "Bash(env)",
      "Bash(printenv:*)",
      "Bash(echo:*)",
      "Bash(date:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(git show:*)",
      "Bash(git branch:*)",
      "Bash(git tag:*)",
      "Bash(git remote:*)",
      "Bash(git stash list:*)",
      "Bash(git rev-parse:*)",
      "Bash(git describe:*)",
      "Bash(git blame:*)",
      "Bash(git shortlog:*)",
      "Bash(ls:*)",
      "Bash(tree:*)",
      "Bash(diff:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(cut:*)",
      "Bash(awk:*)",
      "Bash(sed -n:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(fd:*)",
      "Bash(ag:*)",
      "Bash(jq:*)",
      "Bash(xxd:*)",
      "Bash(hexdump:*)",
      "Bash(od:*)",
      "Bash(md5sum:*)",
      "Bash(sha256sum:*)",
      "Bash(sha1sum:*)",
      "Bash(python -c:*)",
      "Bash(python3 -c:*)",
      "Bash(node -e:*)",
      "Bash(cargo check:*)",
      "Bash(cargo clippy:*)",
      "Bash(cargo test:*)",
      "Bash(cargo doc:*)",
      "Bash(npm list:*)",
      "Bash(npm ls:*)",
      "Bash(npm view:*)",
      "Bash(npm outdated:*)",
      "Bash(pip list:*)",
      "Bash(pip show:*)",
      "Bash(pip freeze:*)",
      "Bash(type:*)",
      "Bash(man:*)",
      "Bash(help:*)",
      "Bash(lsof:*)",
      "Bash(ps:*)",
      "Bash(top -bn1:*)",
      "Bash(free:*)",
      "Bash(id:*)",
      "Bash(groups:*)",
      "Bash(hostname:*)",
      "Bash(ip addr:*)",
      "Bash(ip route:*)",
      "Bash(ifconfig:*)",
      "Bash(ping -c:*)",
      "Bash(nslookup:*)",
      "Bash(dig:*)",
      "Bash(host:*)",
      "Read(//tmp/**)",
      "Bash(arm-none-eabi-gcc --version)",
      "Bash(make ia4:*)",
      "Bash(OS=Windows_NT /c/msys64/usr/bin/make ia4 TCHAIN_PREFIX=\"/c/ST/STM32CubeCLT_1.18.0/GNU-tools-for-STM32/bin/arm-none-eabi-\")",
      "Bash(wsl bash:*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo rm:*)"
    ]
  }
}
