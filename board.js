import {defs, tiny} from './examples/common.js';

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
    */
    constructor(grid_width, grid_height, start_x, start_z, end_x, end_z){
        this.grid_width = grid_width; //grid_width  
        this.grid_height = grid_height; //grid_height 
        this.start_x = start_x; //starting grid x coordinate 
        this.start_z = start_z; //starting grid z coordinate 
        this.end_x = end_x; //ending grid x coordinate 
        this.end_z = end_z; //ending grid z coordinate 
        this.grid = new Array(); //see above 
        this.horizontal_walls = new Array();
        this.vertical_walls = new Array();
        this.cell_array = new Array();
        this.init_grid();
    }


    between(value, min, max) {
        return value >= min && value <= max;    
    }

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

        directions.map((direction) => {
            let nx = cx + dx[direction];
            let ny = cy + dy[direction];

            if (this.between(ny, 0, this.grid.length-1)
                && this.between(nx, 0, this.grid[ny].length - 1)
                && this.grid[ny][nx] == 0) {
                
                this.cell_array[cy][cx][direction] = true;

                this.grid[cy][cx] = direction;
                this.grid[ny][nx] = opposite[direction];
                this.carve_passage(nx, ny);

            }
            
        })
    }

    init_grid() { //naive implementation

        for (let i = 0; i < this.grid_height; i++) {
            this.grid[i] = new Array();
            this.cell_array[i] = new Array();
            for (let j = 0; j < this.grid_width; j++) {
                this.cell_array[i][j] = new Cell(j, i);
                this.grid[i][j] = 0;
            }
        }

        this.carve_passage(0, 0);


    }
    
    //implement search algorithm 
    dfs(){}
    bfs(){}

}

export {Board};
