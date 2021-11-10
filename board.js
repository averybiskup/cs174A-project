import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Board {
    /*
    Board class stores all the information about the current state of the game as well as implementation of searching algorithm 
    width: integer value that stores the width of the maze 
    height: integer value that stores the height of the maze
    grid: 2D array that stores info for items on each 2x2 grid (naive implementation)
          for now, 'B' means breakable bricks (cube)
                   'W' means unbreakable walls (cube)
                   'S' means starting points/plane (custume made plane)
                   'E' means destiniation (ball)
                   ' ' means open space
                   in each grid there might be more fields added for searching algorithm. 
    */
    constructor(grid_width, grid_height, start_x, start_z, end_x, end_z){
        this.grid_width = grid_width;
        this.grid_height = grid_height;
        this.start_x = start_x;
        this.start_z = start_z;
        this.end_x = end_x;
        this.end_z = end_z;
        this.grid = new Array();
        this.init_grid();
    }

    init_grid(){ //naive implementation
        for(let i = 0; i < this.grid_width; i++){
            this.grid[i] = new Array();
            for(let j = 0; j < this.grid_height; j++){
                this.grid[i][j] = 'B';
            }
        }
        this.grid[this.start_x][this.start_z] = 'S';
        this.grid[this.end_x][this.end_z] = 'E';
        //randomly add walls and open space for tesing 
        let count = 100;
        for(let i = 0; i < count; i++){
            let random_x = Math.floor(Math.random() * this.grid_width);
            let random_z = Math.floor(Math.random() * this.grid_height);
            if((random_x != this.start_x || random_z != this.start_z) && (random_x != this.end_x || random_z != this.end_z)){
                this.grid[random_x][random_z] = 'W';
            }
        }
        count = 40;
        for(let i = 0; i < count; i++){
            let random_x = Math.floor(Math.random() * (this.grid_width - 1));
            let random_z = Math.floor(Math.random() * (this.grid_height - 1));
            if((random_x != this.start_x || random_z != this.start_z) && (random_x != this.end_x || random_z != this.end_z)){
                this.grid[random_x][random_z] = ' ';
            }
        }
    }
    
    //implement search algorithm 
    dfs(){}
    bfs(){}

}

export {Board};