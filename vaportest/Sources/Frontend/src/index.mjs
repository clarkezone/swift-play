import "./styles.css";
import { MatrixInstance } from "./matrix.mjs";

const rive = require("@rive-app/canvas");

class WebSocketManager {
  constructor() {
    this.socket = new WebSocket("ws://" + location.host + "/channel");
    this.riveInstances = new Map();
    this.matrixInstances = new Map();
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
      case "addRiveInstance":
        this.handleAddRiveInstance(words);
        break;
      case "removeRiveInstance":
        const INSTANCE_ID_TO_REMOVE = words[1];
        this.handleRemoveRiveInstance(INSTANCE_ID_TO_REMOVE);
        break;
      case "addMatrixInstance":
        this.handleAddMatrixInstance(words);
        break;
      case "removeAllInstances":
        console.log("Removing all instances");
        this.handleRemoveAllInstances();
        break;
      case "removeMatrixInstance":
        this.handleRemoveMatrixInstance(words);
        break;
      default:
        this.handleRiveCommand(words);
    }
  }

  handleRemoveAllInstances() {

    this.riveInstances.forEach((value, key, map) => {
      console.log("Destroying rive instance:", key);
      value.destroy();
      this.riveInstances.delete(value.uuid);
    });

    this.matrixInstances.forEach((value, key, map) => {
      console.log("Destroying matrix instance:", key);
      value.destroy();
      this.matrixInstances.delete(value.uuid);
    });
  }

  handleAddRiveInstance(words) {
    const INSTANCE_ID = words[1];
    const INSTANCE_NAME = words[2];
    const RIVE_SRC = words[3];
    if (RIVE_SRC == "companion") {
      console.log("Companion rive instance detected.  Skipping.");
      return;
    }
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
  }

  handleRemoveRiveInstance(name) {
    const instance = this.riveInstances.get(name);
    if (instance) {
      instance.destroy();
      this.riveInstances.delete(name);
    }
  }

  handleRiveCommand(words) {
    const MESSAGE_TYPE = words[0];
    const INSTANCE_ID_COMMAND = words[1];
    const riveInstance = this.riveInstances.get(INSTANCE_ID_COMMAND);
    if (!riveInstance) {
      console.log(`Rive instance "${INSTANCE_ID_COMMAND}" not found.`);
    }
    const PARAM_1 = words[2];
    const PARAM_2 = words[3];
    const PARAM_3 = words[4];
    const PARAM_4 = words[5];
    //    const PARAM_5 = words[6];
    switch (MESSAGE_TYPE) {
      case "play":
        if (PARAM_1 && riveInstance) {
          riveInstance.play(PARAM_1);
        }
        break;
      case "pause":
        if (PARAM_1 && riveInstance) {
          riveInstance.pause(PARAM_1);
        }
        break;
      case "stop":
        if (PARAM_1 && riveInstance) {
          riveInstance.stop(PARAM_1);
        }
        break;
      case "setRun":
        if (PARAM_1 && PARAM_2 && riveInstance) {
          riveInstance.setTextRunValue(PARAM_1, PARAM_2);
        }
        break;
      case "reset":
        if (PARAM_1 && PARAM_2 && riveInstance) {
          riveInstance.resetstatemachine(PARAM_1, PARAM_2);
        }
        break;
      case "runStep":
        this.handleRiveStep(PARAM_1, PARAM_2, PARAM_3, PARAM_4, INSTANCE_ID_COMMAND);
        break;
      default:
        console.log("Unknown message type:", MESSAGE_TYPE);
    }
  }

  handleRiveStep(artBoard, stateMachine, inputName, inputValue, instanceID) {
    if (artBoard == "companion") {
      return;
    }
    var instance = this.riveInstances.get(instanceID);
    if (!instance) {
      console.log(`Instance instance "${instanceID}" not found in rive instances.`);
      instance = this.matrixInstances.get(instanceID);
      if (!instance) {
        console.log(`Instance instance "${instanceID}" not found in rive instances.`);
        return;
      } else {

        console.log(`Matrix instance found for "${instanceID}"`);
      }
    } else {
      console.log(`Rive Instance found for "${instanceID}"`);
    }

    if (artBoard == "matrix" && instance) {
      instance.setVisible(stateMachine);
      return;
    }

    if (artBoard && stateMachine) {
      console.log(`handleRiveStep called with P1:"${artBoard}":P2:"${stateMachine}"P3:"${inputName}"P4:"${inputValue}":`);

      instance.switchArtboardIfNeeded(artBoard, stateMachine, true);
      if (inputName.includes('\/')) {
        var lastIndexOfSlash = inputName.lastIndexOf('\/');
        var components = inputName.split('\/');
        if (components.length >= 1) { // we have a path
          var path = inputName.substring(0, lastIndexOfSlash);
          var name = components[components.length - 1];
          console.log("inputName contains a path hence using SetBooleanStateAtPath :", inputName);
          console.log("Last part of path (name) :", components[components.length - 1]);
          console.log("Remainder :", inputName.substring(0, lastIndexOfSlash));
          if (inputValue.toLowerCase() === "true") {
            console.log("setting to true:", name, path);
            instance.setBooleanStateAtPath(name, true, path);
          } else if (inputValue.toLowerCase() === "false") {
            console.log("setting to false:", name, path);
            instance.setBooleanStateAtPath(name, false, path);
          }
          //instance.setBooleanStateAtPath("ShowPhoneLaptopNas", true, "Tailnet");
          return;
        }
      }
      console.log(`Getting inputs for "${stateMachine}"`);
      const smInputs = instance.stateMachineInputs(stateMachine);
      if (smInputs != null) {
        console.log("finding inputs ", inputName);
        const namedInput = smInputs.find((i) => i.name == inputName);
        if (namedInput) {
          console.log("input found");
          if (inputValue) {
            console.log(`exitValue set to value of Param4: ${inputValue}`);
            if (inputValue.toLowerCase() === "true") {
              console.log("setting to true");
              namedInput.value = true;
            } else if (inputValue.toLowerCase() === "false") {
              console.log("setting to false");
              namedInput.value = false;
            }
            console.log("done with set.");
          } else {
            console.log(`exitValue toggled to ${namedInput.value}`);
            namedInput.value = !namedInput.value;
          }
        } else {
          console.log(`inputName "${inputName}" not found.`);
        }
      } else {
        console.log("inputs is null for statemachine", stateMachine);
      }
    }
  }

  addRiveInstance(uuid, name, src, x, y, width, height, smname, autoplay) {
    const instance = new RiveInstance(uuid, name, src, x, y, width, height, smname, autoplay);
    this.riveInstances.set(uuid, instance);
  }

  updateRiveInstance(existing, name, x, y, width, height, smname, autoplay) {
    try {
      const instance = existing;
      instance.resetstatemachine(smname, autoplay);
      instance.updateDom(name, x, y, width, height);
    } catch (e) {
      console.log("Error updating Rive Instance: ", e);
    }
  }

  handleAddMatrixInstance(words) {
    const INSTANCE_ID = words[1];
    const INSTANCE_NAME = words[2];
    const X_POSITION = parseFloat(words[3]);
    const Y_POSITION = parseFloat(words[4]);
    const WIDTH = parseFloat(words[5]);
    const HEIGHT = parseFloat(words[6]);
    console.log(INSTANCE_ID, INSTANCE_NAME, X_POSITION, Y_POSITION, WIDTH, HEIGHT);
    const instexists = this.matrixInstances.get(INSTANCE_ID);
    if (!instexists) {
      console.log("Adding Matrix instance:", INSTANCE_ID);
      this.addMatrixInstance(
        INSTANCE_ID,
        INSTANCE_NAME,
        X_POSITION,
        Y_POSITION,
        WIDTH,
        HEIGHT,
      );
    } else {
      console.log("Matrix instance already exists:", INSTANCE_ID);
      this.updateMatrixInstance(
        instexists,
        INSTANCE_ID,
        X_POSITION,
        Y_POSITION,
        WIDTH,
        HEIGHT,
      );
    }
  }

  addMatrixInstance(uuid, name, x, y, width, height) {
    const instance = new MatrixInstance(uuid, name, x, y, width, height);
    this.matrixInstances.set(uuid, instance);
  }

  updateMatrixInstance(existing, name, x, y, width, height) {
    const instance = existing;
    instance.updateDom(name, x, y, width, height);
  }

  handleRemoveMatrixInstance(words) {
    const instanceId = words[1];
    const instance = this.matrixInstances.get(instanceId);
    if (instance) {
      instance.destroy();
      this.matrixInstances.delete(instanceId);
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
    if (this.riveInstance.artboard != null) {
      let one = this.riveInstance.artboard.name;
      console.log("currentArtboard", one);
      if (one.localeCompare(artboard) != 0) {
        console.log("Artboard is the different");
        this.resetartboard(artboard, statemachine, autoplay);
      } else {
        console.log("Artboard is the same");
      }
    } else {
      console.log("Artboard is null.  Resetting regardless");
      this.resetartboard(artboard, statemachine, autoplay);
    }
  }

  setBooleanStateAtPath(name, value, path) {
    this.riveInstance.setBooleanStateAtPath(name, value, path);
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
