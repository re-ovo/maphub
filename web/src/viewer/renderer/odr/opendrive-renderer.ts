import { Mesh, Scene } from "@babylonjs/core";
import type { OpenDrive } from "core";

export class OpenDriveRenderer extends Mesh {
    private opendrive: OpenDrive;

    constructor(name: string, scene: Scene, opendrive: OpenDrive) {
        super(name, scene);
        this.opendrive = opendrive;
    }
}