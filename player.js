import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

 //Implementation of player's movement goes here

 class Player {
    constructor(player_x, player_z, current_model_transform){
        this.grid_x = player_x; //grid x-coord of player 
        this.grid_z = player_z; //grid y-coord of player 
        this.point_to = 0; //direction the player points to relative to South default 0 rad  
        this.model_transform = current_model_transform; //holds current model_transform of player for mixing later on
    }

    //implement discrete movement of player for automated path finding algorithm. place holder for now  
    move_north(){
         let model_transform = this.model_transform;
         return model_transform;
     }
    move_south(){
        let model_transform = this.model_transform;
        return model_transform;
    }
    move_west(){
        let model_transform = this.model_transform;
        return model_transform;
    }
    move_east(){
        let model_transform = this.model_transform;
        return model_transform;
    }
 }

 export {Player};