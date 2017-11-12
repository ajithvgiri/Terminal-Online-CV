var sudoActivated = false, talkActivated = false;

var terminal = new Vue({
	el: '#terminal',

	data: {
		allCommands: [{}],
		inputCommands: [],
		inputVal: "",
		historyIndex: 0,
		terminalInit: false,
		rootUrl: "http://ArunD.in/"
	},

	created: function () {
		if (window.localStorage.inputCommands != undefined) {
			this.inputCommands = JSON.parse(window.localStorage.inputCommands);
		}
	},

	watch: {
		inputVal: function () {
			// for mocking password
			if (sudoActivated == true) {
				this.inputVal = "";
			}
		}
	},

	methods: {

		// when guest clicks the enter button from terminal
		terminalSubmit: function () {

			// send input commands to backend.. and send it to slack/telegram..
			$.post("terminal-commands", {command: this.inputVal});

			this.inputVal = this.inputVal.replace(/&&/g, " && ");
			this.inputVal = this.inputVal.replace(/\s\s+/g, ' ');
			this.inputVal = this.inputVal.trim();

			if (sudoActivated == true) {
				this.processInputCommandAndReply("");
				this.inputVal = "";
			}
			else if (this.inputVal == '') {
				// do nothing
			}
			// manage multiple input commands.. commands with &&
			else if (this.inputVal != "exit && show gui" && this.inputVal.indexOf(" && ") >= 0) {
				// has multiple commands.. found &&
				var splitCommands = this.inputVal.split(" && ");

				if (splitCommands != undefined && splitCommands.length > 0) {
					splitCommands.map(function (s_cmd) {
						this.executeThisCommand(s_cmd);
					}.bind(this));
				}
			}
			// manage all other commands
			else {

				this.inputVal = this.inputVal.toLowerCase();

				if (talkActivated == true) {
					this.allCommands.push({ txt: this.inputVal, type: 1, line_class: "line talk-activated" });
				} else {
					this.allCommands.push({ txt: this.inputVal, type: 1, line_class: "line" });

					this.addNewCommandsToHistory();
				}

				this.processInputCommandAndReply(this.inputVal);

				this.inputVal = "";

				this.scrollToEnd();
			}
		},

		scrollToEnd: function () {
			$('.terminal-body').animate({ scrollTop: $('.terminal-body').prop("scrollHeight") }, 500);
		},

		// add input commands to history.. if it is not in talk mode
		addNewCommandsToHistory: function () {
			var tempInputCommands = [];

			// remove duplicates in history
			this.inputCommands.map(function (inp) {
				if (inp != this.inputVal) {
					tempInputCommands.push(inp);
				}
			}.bind(this));

			this.inputCommands = tempInputCommands;
			this.inputCommands.push(this.inputVal);

			// store input commands in local storage.. for history..
			window.localStorage.setItem("inputCommands", JSON.stringify(this.inputCommands));
		},

		// check input commands and process them
		processInputCommandAndReply: function (cmd) {

			if (sudoActivated == true) {
				sudoActivated = false;
				this.allCommands.push({ txt: "sudo: incorrect password attempt", type: 1, line_class: "" });
			}

			/**
			 * TALK BOT
			 */
			else if (cmd == 'talk' || talkActivated == true) {
				this.manageTalkCommand(cmd);
			}

			/**
			 * Exit
			 */
			else if (possibleCommands.exit.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: "exiting terminal... loading gui page...", type: 0, line_class: "" });
				window.open("home");
			}

			/**
			 * Download Resume
			 */
			else if (possibleCommands.resume.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: "downloading resume...", type: 0, line_class: "" });
				window.open("cv");
			}

			/**
			 * view resume
			 */
			else if (possibleCommands.view_resume.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: "printing resume...", type: 0, line_class: "" });
				window.open("cv/view");
			}

			/* Skills */
			else if (possibleCommands.skills.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.skills, type: 0, line_class: "" });
			}

			/* Area of interest */
			else if (possibleCommands.interests.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.interests, type: 0, line_class: "" });
			}

			/* Experiances */
			else if (possibleCommands.experiances.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.experiances, type: 0, line_class: "" });
			}

			/* Projects */
			else if (possibleCommands.projects.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.projects, type: 0, line_class: "" });
			}

			/* Edu */
			else if (possibleCommands.edu.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.edu, type: 0, line_class: "" });
			}

			/* achievements */
			else if (possibleCommands.achievements.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.achievements, type: 0, line_class: "" });
			}

			/* extra_activities */
			else if (possibleCommands.extra_activities.indexOf(cmd) >= 0) {
				this.allCommands.push({ txt: answers.extra_activities, type: 0, line_class: "" });
			}

			// all other possible commands
			else if (answers[cmd] != undefined) {
				this.allCommands.push({ txt: answers[cmd], type: 0, line_class: "" });
			}

			/**
			 * Clear
			 */
			else if (possibleCommands.clear.indexOf(cmd) >= 0) {
				this.allCommands = [{}];
			}

			/**
			 * No such command found
			 */
			else {

				var reply = "";

				// ls command
				if (cmd.substring(0, 3) == "ls ") {
					reply = "ls: cannot access " + cmd.substring(3) + ": No such file or directory. <br>" + answers.ls;
				}
				// echo command
				else if (cmd.substring(0, 5) == "echo ") {
					reply = cmd.substring(5);
				}
				// cd command
				else if (cmd == "cd") {
					reply = "";
				}
				else if (cmd.substring(0, 3) == "cd ") {
					reply = "bash: cd: /" + cmd.substring(3) + ": No such file or directory";
				}
				// pwd command
				else if (cmd == "pwd") {
					reply = "/home/arund.in";
				}
				// no permission commands command
				else if (
					cmd == "mkdir" || cmd.substring(0, 6) == "mkdir " ||
					cmd == "chmod" || cmd.substring(0, 6) == "chmod " ||
					cmd == "chown" || cmd.substring(0, 6) == "chown " ||
					cmd == "rmdir" || cmd.substring(0, 6) == "rmdir " ||
					cmd == "cp" || cmd.substring(0, 3) == "cp " ||
					cmd == "diff" || cmd.substring(0, 5) == "diff " ||
					cmd == "more" || cmd.substring(0, 5) == "more " ||
					cmd == "mv" || cmd.substring(0, 3) == "mv " ||
					cmd == "rm" || cmd.substring(0, 3) == "rm " ||
					cmd == "pico" || cmd.substring(0, 5) == "pico " ||
					cmd == "nano" || cmd.substring(0, 5) == "nano " ||
					cmd == "ps" || cmd.substring(0, 3) == "ps " ||
					cmd == "whereis" || cmd.substring(0, 8) == "whereis " ||
					cmd == "mount" || cmd.substring(0, 6) == "mount " ||
					cmd == "unmount" || cmd.substring(0, 8) == "unmount " ||
					cmd == "zip" || cmd.substring(0, 4) == "zip " ||
					cmd == "unzip" || cmd.substring(0, 6) == "unzip " ||
					cmd == "df" || cmd.substring(0, 3) == "df " ||
					cmd == "apt" || cmd.substring(0, 4) == "apt " ||
					cmd == "apt-get" || cmd.substring(0, 8) == "apt-get " ||
					cmd == "cat" || cmd.substring(0, 4) == "cat "
				) {
					reply = "Permission denied";
				}
				// sudo command
				else if (cmd == "sudo" || cmd.substring(0, 5) == "sudo ") {
					reply = "[sudo] password for arun:";
					sudoActivated = true;
				}
				// date command 
				else if (cmd == "date") {
					reply = new Date().toString();
				}
				// history command
				else if (cmd == "history") {
					if (this.allCommands != undefined && this.allCommands.length > 0) {
						this.inputCommands.map(function (h_cmd) {
							reply += h_cmd + "<br>";
						});

						setTimeout(function () {
							this.scrollToEnd();
						}.bind(this), 50);
					}
				}
				// other commands
				else {
					reply = cmd + ": command not found";

					if (this.allCommands.length > 8) {
						reply += "<br>Use the command 'site --help' to view available commands. <br><a href='home' class='remove-link-styles'>Click here</a> to close this terminal and go to my webpage."
					}
				}

				this.allCommands.push({ txt: reply, type: 1, line_class: "" });
			}
		},

		// to show history of commands when arrow keys are pressed
		terminalHistory: function (direction) {

			if (direction == "up") {

				if (this.inputVal == "") {
					this.historyIndex = this.inputCommands.length - 1;
				} else if (this.historyIndex > 0) {
					this.historyIndex--;
				}

				this.inputVal = this.inputCommands[this.historyIndex];

			} else if (direction == "down") {

				if (this.inputVal != "") {
					if (this.historyIndex < (this.inputCommands.length - 1)) {
						this.historyIndex++;
						this.inputVal = this.inputCommands[this.historyIndex];
					} else if (this.historyIndex == this.inputCommands.length - 1) {
						this.inputVal = "";
					}
				}

			}

		},

		// to execute a custom command
		executeThisCommand: function (cmd) {
			this.inputVal = cmd;
			this.terminalSubmit();
		},

		commandCtrl: function (cmd) {

			if (cmd == "C" || cmd == "Z") {
				this.allCommands.push({ txt: "^" + cmd, type: 0, line_class: "" });

				if (talkActivated == true) {
					this.deactivateTalkMode();
				}
			}

			this.scrollToEnd();
		},

		deactivateTalkMode: function () {
			talkActivated = false;
			$(".input-line").removeClass("talk-activated");
			this.allCommands.push({ txt: "talk > Bye. Thanks for talking :)", type: 0, line_class: "" });
		},

		/**
		 * TALK BOT
		 */
		manageTalkCommand: function (cmd) {

			// activate talk mode
			if (talkActivated == false) {
				talkActivated = true;
				$(".input-line").addClass("talk-activated");
				this.allCommands.push({ txt: "talk <i class='fa fa-user'></i> > Hey there. How are you?", type: 0, line_class: "" });
			}
			// deactivate talk mode
			else if (cmd == "exit" || cmd == "end" || cmd == "end talk" || cmd == "exit talk") {
				this.deactivateTalkMode();
			}
			// terminal is in talk mode.. manage input commands and reply them..
			else {
				this.allCommands.push({ txt: "talk <i class='fa fa-user'></i> > Robo is disabled..", type: 0, line_class: "talk-activated" });
			}

		}
	}
});

// init
function showInitialCommands() {
	terminal.terminalInit = true;

	setTimeout(function () {
		$(".terminal-input").focus();
	}, 50);
}

function typeWriter(text, n) {
	if (n < (text.length)) {

		$('.line-1').html(text.substring(0, n + 1));

		n++;

		setTimeout(function () {
			typeWriter(text, n);

			if (n == text.length) {
				setTimeout(function () {
					$(".line-2").show();

					setTimeout(function () {
						showInitialCommands();
					}, 150);
				}, 150);
			}

		}, 150);
	}
}

$(document).ready(function () {
	typeWriter("Hi. I am <b>ARUN D</b> :)", 0);

	console.log(".");
	console.log(".");
	console.log(".");
	console.log("Hey :D");
});

$(".terminal-body").click(function () {
	$(".terminal-input").focus();
});