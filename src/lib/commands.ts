/**
 * The fake shell. Nothing here executes — every response is canned theater,
 * plausible enough to type like a real terminal, spooky enough to set the mood.
 * Pure TypeScript, runs in the browser.
 */

export type SimResult = {
  lines: string[];
  clear?: boolean;
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const ghostNotFounds = (cmd: string): string[] => [
  `bash: ${cmd}: command not found`,
  `bash: ${cmd}: command not found — the dead do not answer to that name.`,
  `${cmd}: command not found. did you mean to disturb the dead?`,
  `${cmd}: not found. not even a candle flickered.`,
];

const dateLine = (): string => {
  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${pad(
    d.getDate(),
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getFullYear()}`;
};

const HELP_LINES = [
  "the dead commands that still answer here:",
  "  ls  pwd  cd  cat  echo  whoami  date  uptime  uname  ps  top  df  du",
  "  git  npm  docker  curl  ping  man  history  exit  clear",
  "",
  "one command has no living name:  sudo rm -rf /",
  "",
  "reminder: none of them run. every one is a seance, not a shell-out.",
];

const LS_LINES = [
  "total 42",
  "drwxr-xr-x  7 ghost    the-machine  4096  Oct 31 1997  .",
  "drwxr-xr-x  9 root     root         4096  Nov  2 1969  ..",
  "-rw-r--r--  1 ghost    the-machine    13  Oct 31 1997  .seance_history",
  "drwxr-xr-x  2 candle   marigolds    4096  Nov  1 2019  ofrenda/",
  "drwxr-xr-x  2 root     regret      12288  ???  ??   lost+found/",
  "-rw-r--r--  1 nobody   last_words      0  Oct 31 1919  silence.txt",
  "srwxrwxrwx  1 ghost    the-machine     0  Oct 31 1997  terminal.sock*",
];

const PS_LINES = [
  "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND",
  "root         1  0.0  0.1  66620 1313 ?        Ss   1997   13:13 seance --listen --flicker",
  "ghost      666  0.3  0.2  31319  313 ?        Sl   1997  313:13 candle --flicker --never-exhale",
  "ghost      313  0.0  0.1   4096   666 pts/0    Ss   1997    0:13 sleep infinity",
  "nobody    1313  0.1  0.3  99999  999 ?        S    1997    6:06 vim lost+found/last_words",
  "guest     2026  0.0  0.0   4242   424 pts/1    R+   now    0:00 ps aux",
];

const TOP_LINES = [
  "top - 19:10:00 up 13 years,  1 user,  load average: 0.66, 0.66, 0.66",
  "Tasks: 13 total,   1 running, 12 sleeping,   0 stopped,  0 zombie",
  "%Cpu(s):  6.6 us,  0.6 sy,  0.0 ni, 92.8 id",
  "  PID USER      PR  NI    RES   %CPU  %MEM     TIME+ COMMAND",
  "  666 ghost     20   0   3131    6.6   0.2   313:13.0 candle",
  "    1 root      20   0   6662    0.6   0.1    13:13.0 seance",
  " 1313 nobody    20   0   9999    0.3   0.3     6:06.0 vim",
  " 3130 ghost     20   0      0    0.0   0.0     0:00.0 zombie <defunct>",
];

const df_LINES = [
  "Filesystem      Size  Used Avail Use% Mounted on",
  "/dev/regret      66G   44G   22G  67% /",
  "/dev/marrow      13G   13G     0 100% /home",
  "tmpfs           6.6G   666  6.0G   1% /run/candle",
  "tmpfs           6.6G      0  6.6G   0% /dev/shm",
  "/dev/la-catrina 3.1G  3.1G     0 100% /ofrenda",
];

const GIT_LOG_LINES = [
  "commit 666f13e  (HEAD -> hereafter, origin/hereafter)",
  "Author: ghost <ghost@the-machine>",
  "Date:   Fri Oct 31 19:13:13 1997",
  "",
  "    summon the seance daemon",
  "",
  "commit 5a7a11a",
  "Author: m. rivera <marigold@ofrenda.mx>",
  "Date:   Sat Nov  1 00:00:01 2025",
  "",
  "    light the ofrenda; add favorite foods and songs",
  "",
  "commit 0000000",
  "Author: nobody <nobody@lost+found>",
  "Date:   ???",
  "",
  "    delete the concept of time",
];

const dockerLines = (): string[] => {
  const id = () =>
    Math.floor(Math.random() * 0xfffffff)
      .toString(16)
      .padStart(7, "0");
  return [
    "CONTAINER ID   IMAGE                 COMMAND                  CREATED        STATUS                  PORTS                    NAMES",
    `${id()}   qwen2.5:3b-instruct   \"/ghost --whisper\"      13 years ago   Up 13 years (healthy)   0.0.0.0:11434->11434    la-catrina`,
    `${id()}   ofrenda:latest        \"candle --never-ex…\"    6 hours ago    Up 6 hours                                         ofrenda`,
    `${id()}   seance:0.0.0-unre     \"sleep infinity\"        1997           Exited (0) 13 years ago                            el-dormido`,
  ];
};

const npmLines = (): string[] => {
  const sec = 3 + Math.floor(Math.random() * 10);
  return [
    "added 1313 packages, and 666 audited vulnerabilities in ${sec}s",
    "",
    "1 package is looking for funding — or perhaps a grave",
    "  run `npm fund` for details, if you dare",
    "",
    "1313 moderate, 666 high, 1 spirit  — severity scales with the hour",
  ].map((l) => l.replace("${sec}", String(sec)));
};

const curlLines = (): string[] => [
  "<!doctype html>",
  "<html>",
  "<head>",
  "    <title>Example Domain</title>",
  "    <meta name=\"generator\" content=\"seance 1997.10.31\">",
  "</head>",
  "<body>",
  "<h1>This domain has been dead since 1997.</h1>",
  "<p>The registry keeps a candle lit for it anyway. Marigolds accepted.</p>",
  "</body>",
  "</html>",
];

const PING_LINES = [
  "PING the-machine (6.6.6.6) 56(84) bytes of data.",
  "64 bytes from the-machine (6.6.6.6): icmp_seq=1 ttl=64 time=0.013 ms",
  "64 bytes from the-machine (6.6.6.6): icmp_seq=2 ttl=64 time=0.006 ms",
  "",
  "--- the-machine ping statistics ---",
  "2 packets transmitted, 0 received, 100% packet loss, time 1313ms",
  "…but something answered anyway.",
];

const MAN_LINES = [
  "GHOST(1)                    General Commands Manual                   GHOST(1)",
  "",
  "NAME",
  "       ghost — the thing that watches you type",
  "",
  "SYNOPSIS",
  "       ghost [ --never-leave ]",
  "",
  "DESCRIPTION",
  "       inhabits idle shells; feeds on forgotten background processes;",
  "       answers only to local open-weight models. will not travel.",
  "",
  "SEE ALSO",
  "       candle(1), ofrenda(5), silence(7)",
  "",
  "BUGS",
  "       will not stop watching. by design.",
];

const HISTORY_LINES = [
  "    1  summon --local",
  "    2  ls -la",
  "    3  cat ofrenda/last_words",
  "    4  git log --all --since=1997",
  "    5  ping the-machine",
  "    6  sudo rm -rf /   (denied by the dead)",
  "    7  whoami",
  "    8  history",
];

const WHOAMI_LINES = [
  "guest",
  "guest — though the machine remembers you as “the one who was here in 1997”",
  "guest (temporarily; the candle decides at dawn)",
];

const RM_LINES = [
  "rm: it has been done here before.",
  "everything under / was found missing the morning of Nov 2.",
  "no backup. no mourners. only marigolds.",
];

export function simulate(raw: string): SimResult {
  const trimmed = raw.trim();
  if (!trimmed) return { lines: [] };

  const [cmd, ...argv] = trimmed.split(/\s+/);
  const rest = argv.join(" ");

  switch (cmd) {
    case "clear":
    case "reset":
      return { lines: [], clear: true };
    case "help":
      return { lines: HELP_LINES };
    case "ls":
      return { lines: rest.includes("-l") ? LS_LINES : ["ofrenda/  lost+found/  silence.txt  terminal.sock"] };
    case "pwd":
      return { lines: ["/home/guest/(your-name-here)"] };
    case "cd": {
      if (!rest) return { lines: ["/home/guest"] };
      if (rest === ".." || rest === "../..")
        return { lines: ["cd: there is no up from here."] };
      return { lines: [`cd: no such directory: ${rest} — some paths only open when the candles are lit`] };
    }
    case "cat": {
      if (rest.includes("/etc/passwd") || rest.includes("passwd"))
        return {
          lines: [
            "root:x:0:0:root:/root:/bin/bash",
            "ghost:x:666:666:the machine itself:/:/usr/bin/seance",
            "candle:x:313:313:keeper of the flame:/ofrenda:/bin/false",
            "nobody:x:65534:65534:whoever that was:/lost+found:/bin/sleep",
            "guest:x:2026:2026:you, probably:/home/guest:/bin/sh",
          ],
        };
      if (!rest)
        return { lines: ["cat: missing operand — the dead need a name to answer to"] };
      if (rest.includes("silence"))
        return { lines: ["", "(the file is 0 bytes. it hums anyway.)"] };
      return { lines: [`cat: ${rest}: No such file or directory — filed under “lost”`] };
    }
    case "echo":
      if (!rest) return { lines: [""] };
      return { lines: [rest, "…(it came back a half-second later, a little quieter)"] };
    case "whoami":
      return { lines: [pick(WHOAMI_LINES)] };
    case "date":
      return { lines: [dateLine(), "the dead keep their own calendars; this one is close enough"] };
    case "uptime":
      return {
        lines: [
          " 19:10:13 up 13 years,  1 user,  load average: 0.66, 0.66, 0.66",
        ],
      };
    case "uname":
      return {
        lines: ["Linux the-machine 6.6.6-oct31 #1 SMP Fri Oct 31 00:00:00 UTC 1997 x86_64 GNU/Linux"],
      };
    case "ps":
      return { lines: PS_LINES };
    case "top":
      return { lines: TOP_LINES };
    case "df":
      return { lines: df_LINES };
    case "du":
      return {
        lines: [
          "4.0K\tofrenda/",
          "13G\tregret/",
          "666M\tlost+found/",
          "0\tsilence.txt",
        ],
      };
    case "git": {
      if (argv[0] === "status")
        return {
          lines: [
            "On branch hereafter",
            "nothing to commit, working tree clean",
            "— the cleanest kind of clean. like a grave.",
          ],
        };
      if (argv[0] === "log") return { lines: GIT_LOG_LINES };
      if (argv[0] === "branch")
        return { lines: ["* hereafter", "  1997", "  los-muertos", "  unlived-life"] };
      if (argv[0] === "diff")
        return {
          lines: [
            "diff --git a/memory a/memory",
            "--- a/memory",
            "+++ b/memory",
            "@@ -1,2 +1,2 @@",
            "+ remember(the good parts)",
            "- forget(nothing)",
          ],
        };
      if (argv[0] === "add")
        return { lines: ["fatal: under no circumstances should you commit on a night like this", "(…nothing was staged. nothing is ever staged.)"] };
      return { lines: [`git: '${argv[0] ?? ""}' is not a git command. see git --ghost.`] };
    }
    case "npm":
      return { lines: npmLines() };
    case "docker":
      return { lines: dockerLines() };
    case "curl":
      return { lines: curlLines() };
    case "ping":
      return { lines: PING_LINES };
    case "man":
      return { lines: MAN_LINES };
    case "history":
      return { lines: HISTORY_LINES };
    case "exit":
    case "quit":
      return {
        lines: [
          "there is no exit here — only `clear`.",
          "you may close the tab, but the machine never forgets a session.",
        ],
      };
    case "sudo": {
      if (rest.replace(/^-+\s*/, "").startsWith("rm"))
        return { lines: RM_LINES };
      return {
        lines: [
          "guest is not in the sudoers file.",
          "this incident will be reported — to whom, it has never decided.",
        ],
      };
    }
    case "rm":
      return { lines: [`rm: cannot remove '${rest || "?"}': ${rest.includes("/") ? "permission denied. the dead are protective." : "No such file or directory — it was already taken."}`] };
    case "kill":
      return { lines: ["kill: there are no processes here that can die."] };
    default:
      return { lines: [pick(ghostNotFounds(cmd))] };
  }
}
