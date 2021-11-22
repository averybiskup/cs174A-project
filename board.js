import {defs, tiny} from './examples/common.js';
import {Player} from './player.js';
import {rand_int, get_model_transform_from_grid} from './utilities.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.N = false;
        this.S = false;
        this.E = false;
        this.W = false;
    }
}

class FinalCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isShown = true;
        this.iswall = true;
        this.isEnd = false;
        this.isPlayer = false;
        this.isVisited = false;
        this.isAnimating = false;
        this.animation_time = 0;
        //color
        this.r;
        this.g;
        this.b;
        this.color;
        //scale
        this.isScaling = false;
        this.scale = 1.0;
        this.scale_time = 0;
    }
    init_color(){
        if(this.iswall || this.isEnd){
            this.r = 0.5;
            this.g = 0.5;
            this.b = 0.5;
        }else if(!this.iswall){
            this.r = 1.0;
            this.g = 1.0;
            this.b = 1.0;
        }
        this.color = color(this.r, this.g, this.b, 1.0);
    }
    update_appearance(dt, current_x, current_z, path_next_x, path_next_z){
        if(this.x === path_next_x && this.y === path_next_z){
            this.r = 1.0;
            this.g = 1.0;
            this.b = 0.0;
            this.isShown = false;
        }
        else if(this.x === current_x && this.y === current_z){//current grid being visited by the algorithm
            this.color = color(1.0, 1.0, 0.0, 1.0);
        }
        else if(this.isAnimating){
            //starting color
            if(this.animation_time === 0){
                this.r = 1.0;
                this.g = 0.8;
                this.b = 0.0;
            }
            this.animation_time += dt;
            this.r = this.r - dt;
            this.b = this.b + dt;
            this.color = color(Math.max(this.r, 0), this.g, Math.min(this.b, 1.0), 1.0)
            if(this.r <= 0 || this.b >=1.0){
                this.r = 0;
                this.b = 1.0;
                this.isAnimating = false;
            } 
        }
        else{//color remain unchanged
            this.color = color(this.r, this.g, this.b, 1.0);
            this.isShown = true;
        }

        if(this.isScaling){
            //set initial scale
            if(this.scale_time === 0){
                this.scale = 0.4;
            }
            this.scale_time += dt;
            this.scale = Math.min(this.scale+dt, 1.0);
            if(this.scale >= 1.0){
                this.isScaling = false;
                this.scale = 1.0;
            }
        }
    }
    
}

class Board {
    /*
    Board class stores all the information about the current state of the game as well as implementation of searching algorithm 
    
    grid: 2D array that stores info for items on each 2x2 grid (naive implementation)
          for now, 'B' means breakable bricks (cube)
                   'W' means unbreakable walls (cube)
                   'S' means starting points/plane (custom made plane)
                   'E' means destiniation (ball)
                   ' ' means open space
                   in each grid there might be more fields added for searching algorithm. 

    Maze generation: Recursive Backtracking
    Based on: http://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking
    */

    constructor(grid_width, grid_height){
        this.grid_width = grid_width; //grid_width  
        this.grid_height = grid_height; //grid_height 
        this.start_x = 0;; //starting grid x coordinate 
        this.start_z = 0; //starting grid z coordinate 
        this.end_x = 0; //ending grid x coordinate 
        this.end_z = 0; //ending grid z coordinate
        this.player; //player of the board   
        this.grid = new Array(); //see above 
        this.cell_array = new Array();
        this.final_grid = new Array();
        this.init_grid();
        this.init_player();
        this.init_end();
        this.init_grid_appearance();
        this.current_x = this.start_x; //searching alg current x 
        this.current_z = this.start_z; //searching alg current y  
        this.time_interval_between_step = 0.04;//default time interval between step
        this.isFoundEnd = false; // searching alg already found end point
        this.isRunningDFS = false;
        this.path = [[' ', this.current_x, this.current_z]]; //store the path of the player each element is an array of 3 elements ['direction', grid_x,  grid_z]
        this.isTracingPath = false;
        this.path_index = 1;
        this.path_prev_x = this.start_x;
        this.path_prev_z = this.start_z;
        this.path_next_x = this.start_x;
        this.path_next_z = this.start_z;
    }


    // method for checking if value is between min and max
    between(value, min, max) {
        return value >= min && value <= max;    
    }

    is_in_bound(x, z){
        return this.between(x, 0, this.grid_width*2 - 1) && this.between(z, 0, this.grid_height*2 - 1);
    } 

    // method for randomly shuffling an array
    shuf(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array
    }

    carve_passage(cx, cy, grid) {

        const opposite = {
            E: "W",
            S: "N",
            W: "E",
            N: "S"
        }

        const dx = {
            E: 1,
            W: -1,
            N: 0,
            S: 0
        }

        const dy = {
            E: 0,
            W: 0,
            N: -1,
            S: 1
        }


        let directions = this.shuf(['N', 'S', 'E', 'W']);

        // Check each direction, and carve path in said direction
        directions.map((direction) => {
            let nx = cx + dx[direction];
            let ny = cy + dy[direction];

            // Make sure this direction hasn't been visited, and it's
            // on the board
            if (this.between(ny, 0, this.grid.length-1)
                && this.between(nx, 0, this.grid[ny].length - 1)
                && this.grid[ny][nx] == 0) {
                
                // Store direction to create maze
                this.cell_array[cy][cx][direction] = true;

                this.grid[cy][cx] = direction;
                this.grid[ny][nx] = opposite[direction];
                this.carve_passage(nx, ny);

            }
            
        })
    }

    init_grid() { //naive implementation

        // Initialize grid, and cell_array for maze
        for (let i = 0; i < this.grid_height; i++) {
            this.grid[i] = new Array();
            this.cell_array[i] = new Array();
            for (let j = 0; j < this.grid_width; j++) {
                this.cell_array[i][j] = new Cell(j, i);
                this.grid[i][j] = 0;
            }
        }

        this.carve_passage(0, 0);

        // Initialize the final grid (2d array of wall/empty space)
        for (let i = 0; i < this.grid_height*2; i++) {
            this.final_grid[i] = new Array();
            for (let j = 0; j < this.grid_width*2; j++) {
                this.final_grid[i][j] = new FinalCell(j, i);
            }
        }


        // Turning cell_array into a 2d array of wall/empty space)
        for (let i = 0; i < this.cell_array.length; i++) {
            for (let j = 0; j < this.cell_array[0].length; j++) {

                let cur_cell = this.cell_array[i][j];

                let final_grid_y = i * 2
                let final_grid_x = j * 2

                let up_cell = true;
                let down_cell = true;
                let right_cell = true;
                let left_cell = true;

                try { up_cell = this.cell_array[i-1][j].S } catch {}
                try { down_cell = this.cell_array[i+1][j].N } catch {}
                try { left_cell = this.cell_array[i][j-1].E } catch {}
                try { right_cell = this.cell_array[i][j+1].W } catch {}

                // Checking for wall between N of current cell, and S of 
                // cell above current cell
                if (cur_cell.N || up_cell && final_grid_y > 0) {
                    this.final_grid[final_grid_y - 1][final_grid_x].iswall = false;
                    this.final_grid[final_grid_y][final_grid_x].iswall = false;
                }

                // Checking for wall between S of current cell, and N of 
                // cell above current cell
                if (cur_cell.S || down_cell && final_grid_y < this.grid_height) {
                    this.final_grid[final_grid_y + 1][final_grid_x].iswall = false;
                    this.final_grid[final_grid_y][final_grid_x].iswall = false;
                }

                // Checking for wall between E of current cell, and W of 
                // cell above current cell
                if (cur_cell.E || right_cell && final_grid_x < this.grid_width) {
                    this.final_grid[final_grid_y][final_grid_x + 1].iswall = false;
                    this.final_grid[final_grid_y][final_grid_x].iswall = false;
                }

                // Checking for wall between W of current cell, and E of 
                // cell above current cell
                if (cur_cell.W || left_cell && final_grid_x > 0) {
                    this.final_grid[final_grid_y][final_grid_x - 1].iswall = false;
                    this.final_grid[final_grid_y][final_grid_x].iswall = false;
                }
                
            }
        }

    }

    init_player(){
         //randomly place player 
         let isPlayerPlaced = false;
         while(!isPlayerPlaced){
            let start_x = rand_int(0, this.grid_width);
            let start_z = rand_int(0, this.grid_height);
            if(!this.final_grid[start_z][start_x].iswall && !this.final_grid[start_z][start_x].isEnd){
               this.start_x = start_x;
               this.start_z = start_z;
               this.final_grid[start_z][start_x].isPlayer = true;
               this.player = new Player(start_x, start_z, 0.8, 0, 20);
               isPlayerPlaced = true;
            }
        }
    }

    init_end(){
        let isEndPlaced = false;
        while(!isEndPlaced){
            let end_x = rand_int(0, this.grid_width);
            let end_z = rand_int(0, this.grid_height);
            if(!this.final_grid[end_z][end_x].iswall && !this.final_grid[end_z][end_x].isPlayer){
                this.end_x = end_x;
                this.end_z = end_z;
                this.final_grid[end_z][end_x].isEnd = true;
                isEndPlaced = true;
            }
        }
    }

    init_grid_appearance(){
        for (let i = 0; i < this.grid_height*2; i++) {
            for (let j = 0; j < this.grid_width*2; j++) {
                this.final_grid[i][j].init_color();
            }
        }
    }

    update_grid_appearance(dt){ //temporary for testing 
        for (let i = 0; i < this.grid_height*2; i++) {
            for (let j = 0; j < this.grid_width*2; j++) {
                this.final_grid[i][j].update_appearance(dt, this.current_x, this.current_z, this.path_next_x, this.path_next_z);
            }
        } 
    }

    //move player grid by grid one dir at a time
    discrete_move_player(dt){
        if(this.player.isMovingN){
            this.player.move_north(dt);
        }
        if(this.player.N_moving_distance >= 2){ 
            this.player.isMovingN = false; //stop the movement 
            this.player.N_moving_distance = 0; //reset single movement distance
        }
        if(this.player.isMovingS){
            this.player.move_south(dt);
        }
        if(this.player.S_moving_distance >= 2){ 
            this.player.isMovingS = false; //stop the movement 
            this.player.S_moving_distance = 0; //reset single movement distance
        }
        if(this.player.isMovingE){
            this.player.move_east(dt);
        }
        if(this.player.E_moving_distance >= 2){ 
            this.player.isMovingE = false; //stop the movement 
            this.player.E_moving_distance = 0; //reset single movement distance
        }
        if(this.player.isMovingW){
            this.player.move_west(dt);
        }
        if(this.player.W_moving_distance >= 2){ 
            this.player.isMovingW = false; //stop the movement 
            this.player.W_moving_distance = 0; //reset single movement distance
        }
    }

    //implement search algorithm 
    single_step_dfs(){
        let current_x = this.current_x;
        let current_z = this.current_z;
        this.final_grid[current_z][current_x].isVisited = true;
        if(this.final_grid[current_z][current_x].isEnd){
            this.isFoundEnd = true;
        }
        else{
            //try moving north
            if(this.is_in_bound(current_x, current_z - 1) 
            && !this.final_grid[current_z - 1][current_x].iswall
            && !this.final_grid[current_z - 1][current_x].isVisited){//coord inbound and is not wall and is not visited 
                current_z--;
                this.final_grid[current_z][current_x].isVisited = true;
                this.final_grid[current_z][current_x].isAnimating = true;
                this.path.push(['N', current_x, current_z])
                this.current_x = current_x;
                this.current_z = current_z;
            }
            //try moving south
            else if(this.is_in_bound(current_x, current_z + 1) 
            && !this.final_grid[current_z + 1][current_x].iswall
            && !this.final_grid[current_z + 1][current_x].isVisited){//coord inbound and is not wall and is not visited 
                current_z++;
                this.final_grid[current_z][current_x].isVisited = true;
                this.final_grid[current_z][current_x].isAnimating = true;
                this.path.push(['S', current_x, current_z])
                this.current_x = current_x;
                this.current_z = current_z;
            }
            //try moving west
            else if(this.is_in_bound(current_x - 1, current_z) 
            && !this.final_grid[current_z][current_x - 1].iswall
            && !this.final_grid[current_z][current_x - 1].isVisited){//coord inbound and is not wall and is not visited 
                current_x--;
                this.final_grid[current_z][current_x].isVisited = true;
                this.final_grid[current_z][current_x].isAnimating = true;
                this.path.push(['W', current_x, current_z])
                this.current_x = current_x;
                this.current_z = current_z;
            }
            //try moving east
            else if(this.is_in_bound(current_x + 1, current_z) 
            && !this.final_grid[current_z][current_x + 1].iswall
            && !this.final_grid[current_z][current_x + 1].isVisited){//coord inbound and is not wall and is not visited 
                current_x++;
                this.final_grid[current_z][current_x].isVisited = true;
                this.final_grid[current_z][current_x].isAnimating = true;
                this.path.push(['E', current_x, current_z])
                this.current_x = current_x;
                this.current_z = current_z;
            }
            else{
                this.path.pop();
                this.current_x = this.path[this.path.length - 1][1];
                this.current_z = this.path[this.path.length - 1][2]; 
            }
        } 
    }
    bfs(){}

    single_step_trace_path(){
        this.final_grid[this.start_z][this.start_x].isPlayer = false; //now player no longer stays here 
        if(this.path_index >= this.path.length){
            this.isTracingPath = false;
        }else{
            let moving_direction = this.path[this.path_index][0];
            this.path_next_x = this.path[this.path_index][1];
            this.path_next_z = this.path[this.path_index][2];
            this.path_prev_x = this.path[this.path_index - 1][1];
            this.path_prev_z = this.path[this.path_index - 1][2]; 
            this.final_grid[this.path_prev_z][this.path_prev_x].isScaling = true;
            switch(moving_direction){
                case 'N': this.player.isMovingN = true;
                          break;
                case 'S': this.player.isMovingS = true;
                          break;
                case 'W': this.player.isMovingW = true;
                          break;
                case 'E': this.player.isMovingE = true;
                          break;
            }
        }
        
    }

}

export {Board};
