import {defs, tiny} from './examples/common.js';
import { get_model_translate_from_grid } from './utilities.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

 //Implementation of player's movement goes here

 class Player {
    constructor(player_x, player_z, scale, point_to, speed){
        this.grid_x = player_x; //grid x-coord of player 
        this.grid_z = player_z; //grid z-coord of player
        this.scale = scale; //player model scaling  
        this.point_to = point_to; //direction the player points to relative to South default 0 rad  
        this.speed = speed; //default speed 2 units/second 
        this.model_transform = get_model_translate_from_grid(player_z, player_x); //holds current model_transform of player
        //stores player's states. 
        //store total time player moving
        this.N_dt = 0; //store total time player moving N
        this.S_dt = 0; //^^S
        this.W_dt = 0; //^^W
        this.E_dt = 0; //^^E

        this.isMovingN = false;
        this.isMovingS = false;
        this.isMovingW = false;
        this.isMovingE = false;

        //keep track of how far the player move for one movement
        this.N_moving_distance = 0.0;
        this.S_moving_distance = 0.0;  
        this.W_moving_distance = 0.0;  
        this.E_moving_distance = 0.0;
        
        //off-set for discrete movement error correction
        this.N_off_set = 0;
        this.S_off_set = 0;
        this.W_off_set = 0;
        this.E_off_set = 0;
    }

    //implement movement of player for automated path finding algorithm.
    move_north(dt){
        this.point_to = Math.PI;
        this.N_moving_distance += dt*this.speed;
        this.N_dt += dt;
        this.model_transform = this.model_transform.times(Mat4.translation(0, 0, -dt*this.speed + this.N_off_set));
    }
    move_south(dt){
        this.point_to = 0;
        this.S_moving_distance += dt*this.speed;
        this.S_dt += dt;
        this.model_transform = this.model_transform.times(Mat4.translation(0, 0, dt*this.speed - this.S_off_set));
    }
    move_west(dt){
        this.point_to = 3/2*Math.PI;
        this.W_moving_distance += dt*this.speed;
        this.W_dt += dt;
        this.model_transform = this.model_transform.times(Mat4.translation(-dt*this.speed + this.W_off_set, 0, 0));
    }
    move_east(dt){
        this.point_to = Math.PI/2;
        this.E_moving_distance += dt*this.speed;
        this.E_dt += dt;
        this.model_transform = this.model_transform.times(Mat4.translation(dt*this.speed - this.E_off_set, 0, 0));
    }

    is_moving(){
        return this.isMovingE || this.isMovingN || this.isMovingS || this.isMovingW;
    }
 }

 export {Player};