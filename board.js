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

class FinalCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.iswall = true;
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

    constructor(grid_width, grid_height, start_x, start_z, end_x, end_z){
        this.grid_width = grid_width; //grid_width  
        this.grid_height = grid_height; //grid_height 
        this.start_x = start_x; //starting grid x coordinate 
        this.start_z = start_z; //starting grid z coordinate 
        this.end_x = end_x; //ending grid x coordinate 
        this.end_z = end_z; //ending grid z coordinate 
        this.grid = new Array(); //see above 
        this.cell_array = new Array();
        this.final_grid = new Array();
        this.init_grid();
    }


    // method for checking if value is between min and max
    between(value, min, max) {
        return value >= min && value <= max;    
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
    
    //implement search algorithm 
    dfs(){}
    bfs(){}

}

export {Board};
