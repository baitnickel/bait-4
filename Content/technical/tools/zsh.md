---
access: 0
---

(In Finder and File > Open dialogs, show hidden files with `Shift-Command-.`)
Define environment variables and aliases in `~/.zprofile`
Run `. ~/.zprofile` to refresh the current shell's environment variables and aliases
Define the terminal prompt in `~/.zshrc`

#### IP Address
Find your current IP address using the command: `ipconfig getifaddr en0`. This will return the IP equivalent to `localhost` (e.g., 192.168.1.70), which can then be used from any device (on the same local network only?) as a URL: `http://192.168.1.70/bait-4/index.html`.

#### Background vs Foreground Processes
To execute a command in the background (e.g., `start-server`), there are two choices:

```
start-server &
```

```
start-server
CTRL-Z
bg
```

In the second option, the command starts in the foreground, `CTRL-Z` suspends it, and `bg` moves it into the background. `bg` will give you the job number in brackets, which can be used to bring the job back into the foreground (e.g., `fg %1`, where `1` is the job number) or terminate the job (e.g., `kill %1`—again, `1` is the job number). You can run the `jobs` command any time to see your job numbers. Note: the `ps` command will display your active process IDs; a process ID (pid) can be used in the `kill` command by entering the pid number (without the `%`).

Re scheduling jobs to run at system startup, see: [launchd](https://en.wikipedia.org/wiki/Launchd) and [How to Use launchd](https://www.maketecheasier.com/use-launchd-run-scripts-on-schedule-macos/)

#### inodes
The theoretical maximum inode number is 2^32, allowing for 4,294,967,295 files in a single file system (disk, disk partition). The `df` command reports statistics on each connected disk volume, including disk/partition capacity and use, and inodes free and used. Use the `-h` option (`df -h`) to get more compact and readable output.

`ls -i foo.txt` reports the inode assigned to the file `foo.txt` (or all files in the directory, including subdirectory files when executed as: `ls -i *`). `ls -id bar` reports the inode assigned to the directory `bar`.

Hard links (`ln foo.txt bar.txt`) create files with the same inode (allowed only when creating an additional file on the same file system). `ls -s foo.txt bar.txt` creates a symbolic (soft) link, each file having its own inode (possibly on different file systems). In a symbolic link, the redirections between two files are maintained in disk block "files".

#### Zsh vs Bash

From: https://apple.stackexchange.com/questions/361870/what-are-the-practical-differences-between-bash-and-zsh

Configuration files: bash reads (mainly) `.bashrc` in non-login interactive shells (but macOS starts a login shell in terminals by default), `.profile` or `.bash_profile` in login shells, and `.inputrc`. Zsh reads (mainly) `.zshrc` (in all interactive shells) and `.zprofile` (in login shells). This means that none of your bash customizations will apply: you'll need to port them over. You can't just copy the files because many things will need tweaking.

Prompt: bash sets the prompt (mainly) from `PS1` which contains backslash escapes. Zsh sets the prompt mainly from `PS1` which contains percent escapes. The functionality of bash's `PROMPT_COMMAND` is available in zsh via the `precmd` and `preexec` hook functions. Zsh has more convenience mechanisms to build fancy prompts including a prompt theme mechanism.

Many of bash's `shopt` settings have a corresponding `setopt` in zsh.

Zsh doesn't treat `#` as a comment start on the command line by default, only in scripts (including `.zshrc` and such). To enable interactive comments, run `setopt interactive_comments`.

In bash, `$foo` takes the value of foo, splits it at whitespace characters, and for each whitespace-separated part, if it contains wildcard characters and matches an existing file, replaces the pattern by the list of matches. To just get the value of foo, you need `"$foo".` The same applies to command substitution `$(foo)`. In zsh, `$foo` is the value of foo and `$(foo)` is the output of foo minus its final newlines, with two exceptions. If a word becomes empty due to expanding empty unquoted variables, it's removed (e.g. `a=; b=; printf "%s\n" one "$a$b"` three `$a$b` five prints one, an empty line, three, five). The result of an unquoted command substitution is split at whitespace but the pieces don't undergo wildcard matching.

Bash arrays are indexed from 0 to (length-1). Zsh arrays are indexed from 1 to length. With `a=(one two three)`, in bash, `${a[1]}` is two, but in zsh, it's one. In bash, if you just reference an array variable without braces, you get the first element, e.g. `$a` is one and `$a[1]` is `one[1]`. In zsh, `$a` expands to the list of non-empty elements, and `$a[1]` expands to the first element. Similarly, in bash, the length of an array is `${#a}`; this also works in zsh but you can write it more simply as `$#a`. You can make 0-indexing the default with `setopt ksh_arrays`; this also turns on the requirement to use braces to refer to an array element.

Bash has extra wildcard patterns such as `@(foo|bar)` to match `foo` or `bar`, which are only enabled with `shopt -s extglob`. In zsh, you can enable these patterns with `setopt ksh_glob`, but there's also a simpler-to-type native syntax such as `(foo|bar)`, some of which requires `setopt extended_glob` (do put that in your `.zshrc`, and it's on by default in completion functions). `**/` for recursive directory traversal is always enabled in zsh.

In bash, by default, if a wildcard pattern doesn't match any file, it's left unchanged. In zsh, by default, you'll get an error, which is usually the safest setting. If you want to pass a wildcard parameter to a command, use quotes. You can switch to the bash behavior with `setopt no_nomatch`. You can make non-matching wildcard patterns expand to an empty list instead with `setopt null_glob`.

In bash, the right-hand side of a pipeline runs in a subshell. In zsh, it runs in the parent shell, so you can write things like `somecommand | read output`.

Here are a few nice zsh features that bash doesn't have (at least not without some serious elbow grease). Once again, this is just a selection of the ones I consider the most useful.

Glob qualifiers allow matching files based on metadata such as their time stamp, their size, &c. They also allow tweaking the output. The syntax is rather cryptic, but it's extremely convenient. Here are a few examples:

- `foo*(.)`: only regular files matching `foo*` and symbolic links to regular files, not directories and other special files.
- `foo*(*.)`: only executable regular files matching `foo*`.
- `foo*(-.)`: only regular files matching `foo*`, not symbolic links and other special files.
- `foo*(-@)`: only dangling symbolic links matching `foo*`.
- `foo*(om)`: the files matching `foo*`, sorted by last modification date, most recent first. Note that if you pass this to `ls`, it'll do its own sorting. This is especially useful in…
- `foo*(om[1,10])`: the 10 most recent files matching `foo*`, most recent first.
- `foo*(Lm+1)`: files matching `foo*` whose size is at least 1MB.
- `foo*(N)`: same as `foo*`, but if this doesn't match any file, produce an empty list regardless of the setting of the `null_glob` option (see above).
- `*(D)`: match all files including dot files (except `.` and `..`).
- `foo/bar/*(:t)` (using a history modifier): the files in `foo/bar`, but with only the base name of the file. E.g. if there is a `foo/bar/qux.txt`, it's expanded as `qux.txt`.
- `foo/bar/*(.:r)`: take regular files under `foo/bar` and remove the extension. E.g. `foo/bar/qux.txt` is expanded as `foo/bar/qux`.
- f`oo*.odt(e\''REPLY=$REPLY:r.pdf'\')`: take the list of files matching `foo*.odt`, and replace `.odt` by `.pdf` (regardless of whether the PDF file exists).

Here are a few useful zsh-specific wildcard patterns.

- `foo*.txt~foobar*`: all `.txt` files whose name starts with `foo` but not `foobar`.
- `image<->.jpg(n)`: all `.jpg` files whose base name is `image` followed by a number, e.g. `image3.jpg` and `image22.jpg` but not `image-backup.jpg`. The glob qualifier (`n`) causes the files to be listed in numerical order, i.e. `image9.jpg` comes before `image10.jpg` (you can make this the default even without `-n` with `setopt numeric_glob_sort`).

To mass-rename files, zsh provides a very convenient tool: the `zmv` function. Suggested for your `.zshrc`:
```
autoload zmv
alias zcp='zmv -C' zln='zmv -L'
```

Example:
```
zmv '(*).jpeg' '$1.jpg'
zmv '(*)-backup.(*)' 'backups/$1.$2'
```

Bash has a few ways to apply transformations when taking the value of a variable. Zsh has some of the same and many more.

Zsh has a number of little convenient features to change directories. Turn on `setopt auto_cd` to change to a directory when you type its name without having to type `cd` (bash also has this nowadays). You can use the two-argument form to `cd` to change to a directory whose name is close to the current directory. For example, if you're in `/some/where/foo-old/deeply/nested/inside` and you want to go to `/some/where/foo-new/deeply/nested/inside`, just type `cd old new`.

To assign a value to a variable, you of course write `VARIABLE=VALUE`. To edit the value of a variable interactively, just run `vared VARIABLE`.

Zsh comes with a configuration interface that supports a few of the most common settings, including canned recipes for things like case-insensitive completion. To (re)run this interface (the first line is not needed if you're using a configuration file that was edited by `zsh-newuser-install`):
```
autoload -U zsh-newuser-install
zsh-newuser-install
```

Out of the box, with no configuration file at all, many of zsh's useful features are disabled for backward compatibility with 1990's versions. `zsh-newuser-install` suggests some recommended features to turn on.