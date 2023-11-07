# Custom aliases
alias cc='echo "$(git log -1 --format=%s)"|clip && echo "COPIED! --> $(git log -1 --format=%s)"'
alias pr='start https://github.com/phamlehoan/railway-payroll/compare..."$(git branch --show-current)"'

alias gl="git log --graph --pretty='%Cred%h%Creset -%C(auto)%d%Creset %s %Cgreen(%ar) %C(bold blue)<%an>%Creset' --all"

alias gf='git branch -D develop && git fetch origin develop:develop && git rebase develop && gl -5'
alias gfr='git fetch origin develop:develop && git rebase develop && gl -5'
alias gp='git push origin "$(git branch --show-current)"'

alias gco='git checkout'
alias gdb='git branch | grep -v "develop" | grep -v "$(git branch --show-current)" | xargs git branch -D'

alias ga='git add .'

alias gc='git commit --amend -m "$(git log -1 --format=%s)" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m"'
alias gcc='_gc() { git commit -m "feat: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" ;}; _gc'
alias gcu='_gc() { git commit -m "fix: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" ;}; _gc'
alias gct='_gc() { git commit -m "test: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" ;}; _gc'
alias gcr='_gc() { git commit -m "refactor: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" ;}; _gc'

alias gcp='ga && git commit --amend -m "$(git log -1 --format=%s)" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" && gf && gp -f && cc && pr'
alias gccp='_gc() { ga && git commit -m "feat: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" && gf && gp -f && cc && pr ;}; _gc'
alias gcup='_gc() { ga && git commit -m "fix: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" && gf && gp -f && cc && pr ;}; _gc'
alias gctp='_gc() { ga && git commit -m "test: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" && gf && gp -f && cc && pr ;}; _gc'
alias gcrp='_gc() { ga && git commit -m "refactor: $1" && echo -e "\033[1;35mYour commit - \033[0;33m$(git log -1 --format=%s)\033[0m" && gf && gp -f && cc && pr ;}; _gc'

alias gh='echo -e "\
\033[1;31m gh  \t \033[0m: show help\n\
\n\
\033[1;31m gl  \t \033[0m: show list of commits\n\
\n\
\033[1;31m gf  \t \033[0m: get new code (merged in AWS) to current branch\n\
\033[1;31m gfr \t \033[0m: get new code (merged in AWS) to current branch with out delete develop branch\n\
\033[1;31m gp  \t \033[0m: push current branch to AWS\n\
\n\
\033[1;31m gco \t \033[0m: checkout to \033[1;33m[...]\n\
\033[1;31m gdb \t \033[0m: delete all branch, exclude develop and current branch\n\
\n\
\033[1;31m ga  \t \033[0m: add all changes\n\
\n\
\033[1;31m gc  \t \033[0m: commit amend with latest commit message\n\
\033[1;31m gcc \t \033[0m: create new feature commit with message - \033[0;33mfeature: \033[1;33m[...] \n\
\033[1;31m gcu \t \033[0m: create new fix commit with message - \033[0;33mfix: \033[1;33m[...] \n\
\033[1;31m gct \t \033[0m: create new test commit with message - \033[0;33mtest: \033[1;33m[...] \n\
\033[1;31m gcr \t \033[0m: create new refactor commit with message - \033[0;33mrefactor: \033[1;33m[...] \n\
\n\
\033[1;31m gcp  \t \033[0m: commit amend with latest commit message, rebase new code, copy commit message and open PR page\n\
\033[1;31m gccp \t \033[0m: create new feature commit with message - \033[0;33mfeature: \033[1;33m[...]\033[0m, rebase new code, copy commit message and open PR page\n\
\033[1;31m gcup \t \033[0m: create new fix commit with message - \033[0;33mfix: \033[1;33m[...]\033[0m, rebase new code, copy commit message and open PR page\n\
\033[1;31m gctp \t \033[0m: create new test commit with message - \033[0;33mtest: \033[1;33m[...]\033[0m, rebase new code, copy commit message and open PR page\n\
\033[1;31m gcrp \t \033[0m: create new refactor commit with message - \033[0;33mrefactor: \033[1;33m[...]\033[0m, rebase new code, copy commit message and open PR page\n\
\n\
\033[1;31m gcp  \t \033[0m: commit amend with latest commit message then rebase, push, copy commit message and go to create PR page \n\
\033[1;31m gccp \t \033[0m: create new feature commit with message - \033[0;33mfeature: \033[1;33m[...]\033[0m then rebase, push, copy commit message and go to create PR page \n\
\033[1;31m gcup \t \033[0m: create new fix commit with message - \033[0;33mfix: \033[1;33m[...]\033[0m then rebase, push, copy commit message and go to create PR page \n\
\033[1;31m gctp \t \033[0m: create new test commit with message - \033[0;33mtest: \033[1;33m[...]\033[0m then rebase, push, copy commit message and go to create PR page \n\
\033[1;31m gcrp \t \033[0m: create new refactor commit with message - \033[0;33mrefactor: \033[1;33m[...]\033[0m then rebase, push, copy commit message and go to create PR page \n\
\n\
\033[1;31m pr  \t \033[0m: open PR page to review and merge code\n\
\033[1;31m cc  \t \033[0m: copy the latest commit message (to paste to Title when create new PR in AWS)\n\
"'

echo "Git commands added!"
