import "./styles.css";

const rive = require("@rive-app/canvas");

class WebSocketManager {
  constructor() {
    this.socket = new WebSocket("ws://" + location.host + "/channel");
    this.riveInstances = new Map();
    this.initSocket();
  }

  initSocket() {
    this.socket.addEventListener("open", (event) => {
      console.log("Socket opened");
    });

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });
  }

  handleMessage(data) {
    console.log("Received message:", data);
    const words = data.split(":");
    const MESSAGE_TYPE = words[0];

    switch (MESSAGE_TYPE) {
      case "addInstance":
        const INSTANCE_ID = words[1];
        const INSTANCE_NAME = words[2];
        const RIVE_SRC = words[3];
        const X_POSITION = parseFloat(words[4]);
        const Y_POSITION = parseFloat(words[5]);
        const WIDTH = parseFloat(words[6]);
        const HEIGHT = parseFloat(words[7]);
        const SMNAME = words[8];
        const AUTOPLAY = words[9];
	console.log(INSTANCE_ID, INSTANCE_NAME, RIVE_SRC, X_POSITION, Y_POSITION, WIDTH, HEIGHT, SMNAME, AUTOPLAY);
        const instexists = this.riveInstances.get(INSTANCE_ID);
        if (!instexists) {
          console.log("Adding instance:", INSTANCE_ID);
          this.addRiveInstance(
            INSTANCE_ID,
            INSTANCE_NAME,
            RIVE_SRC,
            X_POSITION,
            Y_POSITION,
            WIDTH,
            HEIGHT,
	    SMNAME,
	    AUTOPLAY
          );
        } else {
          console.log("Instance already exists:", INSTANCE_ID);
          this.updateRiveInstance(
            instexists,
            INSTANCE_ID,
            X_POSITION,
            Y_POSITION,
            WIDTH,
            HEIGHT,
	    SMNAME,
	    AUTOPLAY
          );
        }
        break;
      case "removeInstance":
        const INSTANCE_ID_TO_REMOVE = words[1];
        this.removeRiveInstance(INSTANCE_ID_TO_REMOVE);
        break;
      default:
        const INSTANCE_ID_COMMAND = words[1];
        const INSTANCE_COMMAND = this.riveInstances.get(INSTANCE_ID_COMMAND);
        if (!INSTANCE_COMMAND) {
          console.error(`Rive instance "${INSTANCE_NAME_COMMAND}" not found.`);
          return;
        }
        const PARAM_1 = words[2];
        const PARAM_2 = words[3];
        const PARAM_3 = words[4];
        const PARAM_4 = words[5];
        switch (MESSAGE_TYPE) {
          case "play":
            if (PARAM_1) {
              INSTANCE_COMMAND.play(PARAM_1);
            }
            break;
          case "pause":
            if (PARAM_1) {
              INSTANCE_COMMAND.pause(PARAM_1);
            }
            break;
          case "stop":
            if (PARAM_1) {
              INSTANCE_COMMAND.stop(PARAM_1);
            }
            break;
          case "setRun":
            if (PARAM_1 && PARAM_2) {
              INSTANCE_COMMAND.setTextRunValue(PARAM_1, PARAM_2);
            }
            break;
          case "reset":
            if (PARAM_1 && PARAM_2) {
              INSTANCE_COMMAND.resetstatemachine(PARAM_1, PARAM_2);
            }
            break;
          case "runstep":
            if (PARAM_1 && PARAM_2) {
	      console.log(`runstep called with P1:"${PARAM_1}":P2:"${PARAM_2}"P3:"${PARAM_3}"P4:"${PARAM_4}":`);
		INSTANCE_COMMAND.switchArtboardIfNeeded(PARAM_1, PARAM_2, true);
	      console.log(`Getting inputs for "${PARAM_2}"`);
              const inputs = INSTANCE_COMMAND.stateMachineInputs(PARAM_2);
	      if (inputs!=null) {
		console.log("finding inputs ", PARAM_3);
              const exitValue = inputs.find((i) => i.name == PARAM_3);
              if (exitValue) {
		console.log("input found");
                if (PARAM_4) {
                  console.log(`exitValue set to value of Param4: ${PARAM_4}`);
		  if (PARAM_4.toLowerCase() === "true") {
		   console.log("setting to true");
                   exitValue.value = true
		} else if (PARAM_4.toLowerCase() === "false") {
		   console.log("setting to false");
		  exitValue.value = false
         	}
		console.log("done with set.");
                } else {
                  console.log(`exitValue toggled to ${exitValue.value}`);
                  exitValue.value = !exitValue.value;
                }
              } else {
		console.error(`exitValue "${exitValue}" not found.`);
	      }
           } else { 
console.log("inputs is null for statemachine", PARAM_2);
							}
            }
            break;
          default:
            console.log("Unknown message type:", MESSAGE_TYPE);
        }
    }
  }

  addRiveInstance(uuid, name, src, x, y, width, height, smname, autoplay) {
    const instance = new RiveInstance(uuid, name, src, x, y, width, height, smname, autoplay);
    this.riveInstances.set(uuid, instance);
  }

  updateRiveInstance(existing, name, x, y, width, height, smname, autoplay) {
    const instance = existing;
    instance.resetstatemachine(smname, autoplay);
    instance.updateDom(name, x, y, width, height);
  }

  removeRiveInstance(name) {
    const instance = this.riveInstances.get(name);
    if (instance) {
      instance.destroy();
      this.riveInstances.delete(name);
    }
  }
}

class RiveInstance {
  constructor(id, name, src, x, y, width, height, smname, autoplay) {
    //TODO: break out update logic and call it from here
    this.uuid = id;
    this.canvas = document.createElement("canvas");
    this.canvas.id = id;
    this.updateDom(name, x, y, width, height);
    document.body.appendChild(this.canvas);
    this.riveInstance = new rive.Rive({
      src: src,
      canvas: this.canvas,
      stateMachines: smname,
      autoplay: autoplay,
      onLoad: () => {
        this.riveInstance.resizeDrawingSurfaceToCanvas();
      },
    });
  }

  destroy() {
    this.riveInstance.cleanup();
    this.canvas.remove();
  }

  updateDom(name, x, y, width, height) {
    this.name = name;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${x}px`;
    this.canvas.style.top = `${y}px`;
    if (this.riveInstance != null && this.canvas != null) {
      this.riveInstance.resizeDrawingSurfaceToCanvas();
    }
  }

  play(animationName) {
    this.riveInstance.play(animationName);
  }

  pause(animationName) {
    this.riveInstance.pause(animationName);
  }

  stop(animationName) {
    this.riveInstance.pause(animationName);
  }

  setTextRunValue(text, value) {
    this.riveInstance.setTextRunValue(text, value);
  }

  switchArtboardIfNeeded(artboard, statemachine, autoplay) {
		// TODO: if artboard is the same but statemachine is different we don't work
    console.log("SwitchArtboardIfNeeded", artboard);
    let one = this.riveInstance.artboard.name;
    console.log("currentArtboard", one);
    if (one.localeCompare(artboard)!=0) {
      console.log("Artboard is the different");
      this.resetartboard(artboard, statemachine, autoplay);
    } else {
			console.log("Artboard is the same");
		}
  }

  resetstatemachine(artboard, autoplay) {
    console.log("ResetStateMachine", artboard, autoplay);
    this.riveInstance.reset({
      artboard: artboard,
//      statemachine: artboard,
      autoplay: autoplay,
    });
  }

  resetartboard(artboard, statemachine, autoplay) {
    console.log("ResetArtboard", artboard, autoplay);
    this.riveInstance.reset({
      artboard: artboard,
      stateMachines: statemachine,
      autoplay: autoplay,
    });
  }

  stateMachineInputs(input) {
    console.log("StateMachineInputs " + input);
    return this.riveInstance.stateMachineInputs(input);
  }
}

var a = new WebSocketManager();
