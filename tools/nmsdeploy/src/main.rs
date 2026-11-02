//! nmsdeploy — stage, commit, push and verify the NMS 460 Trainer on GitHub Pages.
//!
//! No dependencies: it shells out to `git` (which already holds the credential
//! in Windows Credential Manager) and to `curl.exe`, and it proves the deploy
//! landed by polling a build stamp it wrote into the repo.
//!
//! Typical use, from anywhere:
//!
//! ```text
//! publish.cmd                       # commit everything + push + wait for Pages
//! publish.cmd -m "Fix the step strip"
//! publish.cmd --dry-run             # show what would be committed
//! publish.cmd --no-verify           # push without waiting for the live check
//! ```

use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode, Stdio};
use std::thread::sleep;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const DEFAULT_URL: &str = "https://r3naldocreates.github.io/nms-460-trainer/";
const STAMP_FILE: &str = "build.json";

struct Opts {
    dir: PathBuf,
    url: String,
    message: Option<String>,
    no_push: bool,
    no_verify: bool,
    dry_run: bool,
    seconds: u64,
}

fn main() -> ExitCode {
    let opts = match parse_args() {
        Ok(Some(o)) => o,
        Ok(None) => return ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e}");
            return ExitCode::from(2);
        }
    };
    match run(opts) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("\nerror: {e}");
            ExitCode::from(1)
        }
    }
}

fn usage() -> String {
    format!(
        r#"nmsdeploy — publish the NMS 460 Trainer to GitHub Pages

usage: nmsdeploy [options]

  -m, --message <text>   commit message (default: "Update <UTC timestamp>")
  -d, --dir <path>       repository folder (default: current directory)
  -u, --url <url>        live site to verify against
                         (default: {DEFAULT_URL})
      --seconds <n>      how long to wait for Pages (default: 300)
      --no-push          commit locally, do not push
      --no-verify        do not wait for the live site
      --dry-run          list what would be committed, then stop
  -h, --help             show this text

Exit codes: 0 done or nothing to do, 1 failure, 2 bad arguments.
"#
    )
}

fn parse_args() -> Result<Option<Opts>, String> {
    let mut opts = Opts {
        dir: env::current_dir().map_err(|e| format!("cannot read the current directory: {e}"))?,
        url: DEFAULT_URL.to_string(),
        message: None,
        no_push: false,
        no_verify: false,
        dry_run: false,
        seconds: 300,
    };

    let mut args = env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = |name: &str| -> Result<String, String> {
            args.next()
                .ok_or_else(|| format!("{name} needs a value"))
                .map(|v| v.trim().to_string())
        };
        match arg.as_str() {
            "-h" | "--help" => {
                print!("{}", usage());
                return Ok(None);
            }
            "-m" | "--message" => opts.message = Some(value("--message")?),
            "-d" | "--dir" => opts.dir = PathBuf::from(value("--dir")?),
            "-u" | "--url" => opts.url = with_slash(&value("--url")?),
            "--seconds" => {
                opts.seconds = value("--seconds")?
                    .parse()
                    .map_err(|_| "--seconds needs a whole number".to_string())?;
            }
            "--no-push" => opts.no_push = true,
            "--no-verify" => opts.no_verify = true,
            "--dry-run" => opts.dry_run = true,
            other => return Err(format!("unknown option {other:?} — try --help")),
        }
    }
    Ok(Some(opts))
}

fn run(opts: Opts) -> Result<ExitCode, String> {
    let dir = &opts.dir;
    if !dir.join(".git").exists() {
        return Err(format!("{} is not a git repository", dir.display()));
    }
    println!("repo   {}", dir.display());
    println!("live   {}\n", opts.url);

    let branch = git(dir, &["rev-parse", "--abbrev-ref", "HEAD"])?;
    let branch = branch.trim().to_string();

    // 1. is there anything to publish?
    let status = git(dir, &["status", "--porcelain"])?;
    let dirty: Vec<&str> = status.lines().filter(|l| !l.trim().is_empty()).collect();

    if dirty.is_empty() {
        println!("working tree is clean — nothing to commit");
        let head = git(dir, &["rev-parse", "--short", "HEAD"])?;
        println!("HEAD   {}", head.trim());
        if !opts.no_verify && !opts.no_push {
            verify(&opts.url, None, opts.seconds)?;
        }
        return Ok(ExitCode::SUCCESS);
    }

    println!("{} change(s) staged for this run:", dirty.len());
    for line in dirty.iter().take(40) {
        println!("  {line}");
    }
    if dirty.len() > 40 {
        println!("  … and {} more", dirty.len() - 40);
    }

    if opts.dry_run {
        println!("\n--dry-run: stopping before the commit");
        return Ok(ExitCode::SUCCESS);
    }

    // 2. stamp the build so the live check can prove which version is up
    let stamp = iso_utc(SystemTime::now());
    let stamp_json = format!(
        "{{\n  \"built\": \"{stamp}\",\n  \"tool\": \"nmsdeploy\"\n}}\n"
    );
    write_file(&dir.join(STAMP_FILE), &stamp_json)?;

    // 3. commit
    git(dir, &["add", "-A"])?;
    let message = opts
        .message
        .clone()
        .unwrap_or_else(|| format!("Update {stamp}"));
    let out = Command::new("git")
        .current_dir(dir)
        .args(["commit", "-m", &message])
        .output()
        .map_err(|e| format!("cannot run git: {e}"))?;
    if !out.status.success() {
        return Err(format!(
            "git commit failed:\n{}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    let head = git(dir, &["rev-parse", "--short", "HEAD"])?;
    println!("\ncommitted {}: {message}", head.trim());

    if opts.no_push {
        println!("--no-push: stopping before the push");
        return Ok(ExitCode::SUCCESS);
    }

    // 4. push
    println!("pushing to origin/{branch} …");
    let out = Command::new("git")
        .current_dir(dir)
        .args(["push", "origin", &branch])
        .output()
        .map_err(|e| format!("cannot run git: {e}"))?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        return Err(format!(
            "git push failed — pull first, then re-run:\n{}",
            err.trim()
        ));
    }
    println!("pushed");

    // 5. wait for Pages to serve that exact stamp
    if opts.no_verify {
        println!("\n--no-verify: not waiting for the live site");
    } else {
        verify(&opts.url, Some(&stamp), opts.seconds)?;
    }
    println!("\nlive → {}", opts.url);
    Ok(ExitCode::SUCCESS)
}

/// Poll `<url>build.json` until it carries `stamp`, then confirm the page loads.
fn verify(url: &str, stamp: Option<&str>, seconds: u64) -> Result<(), String> {
    match stamp {
        None => {
            let code = http_status(url)?;
            println!("\nlive site responds {code}");
            if code != 200 {
                return Err(format!("live site returned HTTP {code}"));
            }
        }
        Some(stamp) => {
            let probe = format!("{url}{STAMP_FILE}?cb={}", epoch_secs());
            println!("\nwaiting for GitHub Pages to serve this build …");
            let deadline = epoch_secs() + seconds;
            let mut attempt = 0;
            loop {
                attempt += 1;
                let body = curl(&probe).unwrap_or_default();
                if body.contains(stamp) {
                    println!("live build confirmed after {attempt} check(s)");
                    break;
                }
                if epoch_secs() >= deadline {
                    return Err(format!(
                        "the live site still shows an older build after {seconds}s.\n\
                         Pages usually takes 30–90s — re-run later, or check the Actions tab."
                    ));
                }
                print!(".");
                use std::io::Write;
                let _ = std::io::stdout().flush();
                sleep(Duration::from_secs(10));
            }
            let code = http_status(url)?;
            println!("page responds {code}");
            if code != 200 {
                return Err(format!("live page returned HTTP {code}"));
            }
        }
    }
    Ok(())
}

fn curl(url: &str) -> Result<String, String> {
    let out = Command::new("curl.exe")
        .args(["-sS", "--max-time", "15", "-H", "Cache-Control: no-cache", url])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .map_err(|e| format!("cannot run curl.exe: {e}"))?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn http_status(url: &str) -> Result<u32, String> {
    let out = Command::new("curl.exe")
        .args([
            "-sS", "-o", "NUL", "-w", "%{http_code}", "--max-time", "20",
            "-H", "Cache-Control: no-cache", url,
        ])
        .stderr(Stdio::null())
        .output()
        .map_err(|e| format!("cannot run curl.exe: {e}"))?;
    String::from_utf8_lossy(&out.stdout)
        .trim()
        .parse()
        .map_err(|_| "could not read the HTTP status".to_string())
}

fn git(dir: &Path, args: &[&str]) -> Result<String, String> {
    let out = Command::new("git")
        .current_dir(dir)
        .args(args)
        .output()
        .map_err(|e| format!("cannot run git: {e}"))?;
    if !out.status.success() {
        return Err(format!(
            "git {} failed:\n{}",
            args.join(" "),
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn write_file(path: &Path, body: &str) -> Result<(), String> {
    std::fs::write(path, body).map_err(|e| format!("cannot write {}: {e}", path.display()))
}

fn with_slash(url: &str) -> String {
    if url.ends_with('/') {
        url.to_string()
    } else {
        format!("{url}/")
    }
}

fn epoch_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// `2026-11-03T01:52:07Z` without pulling in chrono.
fn iso_utc(t: SystemTime) -> String {
    let secs = t.duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0) as i64;
    let days = secs.div_euclid(86_400);
    let rem = secs.rem_euclid(86_400);
    let (y, m, d) = civil_from_days(days);
    let hh = rem / 3600;
    let mm = (rem % 3600) / 60;
    let ss = rem % 60;
    format!("{y:04}-{m:02}-{d:02}T{hh:02}:{mm:02}:{ss:02}Z")
}

/// Howard Hinnant's days → civil date.
fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}
