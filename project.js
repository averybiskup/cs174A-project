import {defs, tiny} from './examples/common.js';
import {Board} from './board.js';
import { get_model_translate_from_grid } from './utilities.js';
import { Particles_Emitter } from './particles.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            maze_ground: new defs.Square(),
            boarder: new defs.Cube(),
            cube: new defs.Cube(),
            sphere:  new defs.Subdivision_Sphere(4),
            plane: new defs.Cube(), //place holder for plane 
            player: new defs.Player(),
        }
        // *** Materials
        this.materials = { //all materials are place holder for demo
            ground: new Material(new defs.Phong_Shader(),
                {ambient: .9, diffusivity: .6, color: hex_color("#ffffed")}),
            white_plastic: new Material(new defs.Phong_Shader(), 
                {ambient: 1.0, diffusivity:.6, color: hex_color('#ffffff')}),
            grey_plastic: new Material(new defs.Phong_Shader(),
                {ambient:.6, diffusivity: .6, color: hex_color('#808080')}),
            grey_picker_plastic: new Material(new defs.Phong_Shader(),
                {specularity: 0, ambient:1, diffusivity: 0, color: hex_color('#808080')}),
            green_plastic: new Material(new defs.Phong_Shader(),
                {ambient:.6, diffusivity: .6, color: hex_color('#00ff00')}),
            red_plastic: new Material(new defs.Phong_Shader(),
                {ambient:1, diffusivity: 1, color: hex_color('#ff0000')}),
            plane: new Material(new defs.Phong_Shader(), 
                {ambient: .8, diffusivity: .6, color: hex_color('#ff9c8c')}),
        };

        this.board_width = 21;
        this.board_height = 21;
        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());
    }


    draw_maze_ground(context, program_state){ //on x-z plane
        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.scale(2000.0, 1.0, 2000.0))
                                         .times(Mat4.rotation(Math.PI/2, 1, 0, 0));
        this.shapes.maze_ground.draw(context, program_state, model_transform, this.materials.ground);
    }

    draw_maze_boarder(context, program_state, width, height){ //available area: z: 0 -- height; x: 0 -- width
        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.scale(1.0, 1.0, height/2))
                                         .times(Mat4.translation(-1.0, 1.0, 1.0))
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.grey_plastic);
        model_transform = model_transform.times(Mat4.translation(width+2, 0, 0));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.grey_plastic);
        model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.translation(-2.0, 0, 0))
                                         .times(Mat4.scale(width/2+2, 1.0, 1.0))
                                         .times(Mat4.translation(1.0, 1.0, -1.0));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.grey_plastic);
        model_transform = model_transform.times(Mat4.translation(0, 0, height+2));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.grey_plastic);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.look_at(vec3(20, 70, 15), vec3(20, -50, 25), vec3(0, 1, 0)));

        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 200);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}
export class Project extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */

    constructor() {
        super();

        // Generate a maze with size [board_width/2 x board_height/2]
        // Randomly place start and end point
        this.board = new Board(this.board_width/2, 
                               this.board_height/2, false);
        this.particles_emitter = {
            player_particle_emitter: new Particles_Emitter(2, 0.28, 0.3, vec4(185/255, 255/255, 255/255, 1.0), 3, 1, 3),
        }
        this.time_counter = 0;
        this.drawing_board = true;
        this.current_x = 0;
        this.current_y = 0;
        this.camera_angle = 'side';

        this.listeners_added = false;
        this.pixel = new Uint8Array(4);

        this.player_selected = false;
        this.ball_selected = false;

        this.wall_height = 0;
        
        this.timer_status = false;
        this.timer = 0;
    }

    // Returns true or false if mouse is on valid square or not
    on_board(x, y) {
        return (x >= 0 
            && x <= this.board_width - 1
            && y <= this.board_height - 1
            && y >= 0);
    }

    hover_player(x, y) {
        return (x === this.board.player.grid_x 
                && y === this.board.player.grid_z);
    }

    hover_end(x, y) {
        return (x === this.board.end_x 
                && y === this.board.end_z);
    }

    // Adds event listeners to mouse inputs
    add_listeners(canvas) {
        this.listeners_added = true;
        
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            // Unselecting  / selecting player
            if (this.player_selected) {
                this.player_selected = false;    
                this.board.reset_board(true)
            } else if (this.hover_player(this.pixel[1], this.pixel[0])) {
                this.player_selected = true;
            } else if (this.ball_selected && this.on_board(this.pixel[1], this.pixel[0])) {
                this.ball_selected = false;
                this.board.reset_board(true);
                this.board.final_grid[this.pixel[0]][this.pixel[1]].isEnd = true;
            } else if (this.hover_end(this.pixel[1], this.pixel[0])) {
                this.ball_selected = true;
                this.board.final_grid[this.pixel[0]][this.pixel[1]].isEnd = false;
            }

        });

        canvas.addEventListener("mouseup", e => {
            e.preventDefault();

            const x = this.pixel[1];
            const y = this.pixel[0];

            // Checking if mouse at valid location
            if (this.on_board(x, y) && !this.hover_player(x, y) && !this.hover_end(x, y)) {
                this.board.toggle_grid_wall(this.pixel[0], this.pixel[1]);
            }
        });

        canvas.addEventListener('mousemove', e => {
            e.preventDefault();

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        })
    }

    // Regenerating maze
    regenBoard(sandbox=false) {
        this.board = new Board(this.board_width/2, this.board_height/2, sandbox);
        this.current_x = 0;
        this.current_y = 0;
        this.drawing_board = true;
        this.wall_height = 0;
    }

    // Resetting x size of board
    resetX(value) {
        if (this.board_width + value > 2 && this.board_width + value < 41) {
            this.board_width += value;
            this.board.grid_width += value/2;
            this.regenBoard(this.board.sandbox);
        }
    }

    // Resetting y size of board
    resetY(value) {
        if (this.board_height + value > 2 && this.board_height + value < 41) {
            this.board.grid_height += value/2;
            this.board_height += value;
            this.regenBoard(this.board.sandbox);
        }
    }

    toggle_sandbox() {
        if (this.board.sandbox) {
            this.regenBoard(false);
        } else {
            this.board.set_sandbox();    
        }
    }

    make_control_panel() {

        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.

        this.live_string(box => box.textContent = "Timer: " + Math.round(this.timer));
        this.new_line();
        this.key_triggered_button("Reset and Start Timer", ['t'], () => this.reset_start_timer());
        this.new_line();
        this.new_line();

        //for discrete movement testing purpose
        this.key_triggered_button("Move 1 grid N", ["i"], () => this.board.player.isMovingN = true);
        this.key_triggered_button("Move 1 grid S", ["k"], () => this.board.player.isMovingS = true);
        this.key_triggered_button("Move 1 grid W", ["j"], () => this.board.player.isMovingW = true);
        this.key_triggered_button("Move 1 grid E", ["l"], () => this.board.player.isMovingE = true);
        this.new_line();
        this.new_line();

        this.key_triggered_button("Run DFS", ['q'], () => {
            this.board.isRunningDFS = this.board.is_running_alg()?false:true;
            this.reset_start_timer();
        }); //visualize dfs, if other alg is running it won't work 
        this.key_triggered_button("Run greedy best first", ['w'], () => {
            this.board.isRunningGBF = this.board.is_running_alg()?false:true;
            this.reset_start_timer()
        }); //visualize gbf, if other alg is running it won't work 
        this.new_line();
        this.key_triggered_button("Pause", ['a'], () => this.board.reset_board(true) ); //pause all the algorithm, Preserve both maze and player location
        this.key_triggered_button("Reset", ['s'], () => this.board.reset_board(false) ); //reset board, preserve maze, DO NOT preserve player location
        this.key_triggered_button("Clear wall", ['d'], () => this.board.clear_wall()); //clear all the walls, might be buggy
        this.key_triggered_button("Regenerate", ['f'], () => this.regenBoard() ); //random regeneration of board
        this.new_line();
        this.new_line();

        this.key_triggered_button("Side View", ['z'], () => this.camera_angle = 'side' ); // Change cmaera position to side view
        this.key_triggered_button("Birds View", ['x'], () => this.camera_angle = 'bird' ); // Change camera position to birds eye
        this.key_triggered_button("Follow", ['c'], () => this.camera_angle = 'follow' ); // Change camera to follow player
        this.new_line();
        this.new_line();

        this.key_triggered_button("Decrease x", [','], () => this.resetX(-2) ); // Decrease board in x direction
        this.key_triggered_button("Increase x", ['.'], () => this.resetX(2) ); // Increase board in x direction
        this.key_triggered_button("Decrease y", ['\''], () => this.resetY(-2) ); // Decrease board in y direction
        this.key_triggered_button("Increase y", ['/'], () => this.resetY(2) ); // Increase board in y direction
        this.new_line();
        this.new_line();

        this.key_triggered_button("Regenerate", ['v'], () => this.regenBoard() ); //random regeneration of board
        this.key_triggered_button("Sandbox", ['b'], () => this.toggle_sandbox() ); // Change game mode to sand box
    }

    draw_board_object(context, program_state, model_transform, i, j) {
        const maze = this.board.final_grid
        let wall_color = color(1 - (0.5 * (this.wall_height + 0.2)), 1 - (0.5 * (this.wall_height + 0.2)), 1- (0.5 * (this.wall_height + 0.2)), 1.0)
        if (this.drawing_board) {
            wall_color = color(1 - (0.5 * (this.wall_height + 0.2)), 1 - (0.5 * (this.wall_height + 0.2)), 1- (0.5 * (this.wall_height + 0.2)), 1.0)
        } else {
            wall_color = maze[i][j].color;
        }
            
        if (maze[i][j].iswall) { //draw wall
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, this.wall_height, scale));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: maze[i][j].color}));
        } else {
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.white_plastic.override({color: maze[i][j].color}));
        }

    }

    draw_color_block(context, program_state, model_transform, i, j) {
        
        let maze = this.board.final_grid;
        if (maze[i][j].iswall) { //draw wall
                model_transform = get_model_translate_from_grid(i, j).times(Mat4.scale(0.8, this.wall_height, 0.8));
                this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
        } else if(maze[i][j].isShown){
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
        }
    }

    reset_start_timer() {
        this.timer = 0;
        this.timer_status = true;
    }

    display(context, program_state) {
        super.display(context, program_state);

        if (!this.listeners_added) {
            this.add_listeners(context.canvas); 
        }

        let canvas = context.canvas;
        const gl = canvas.getContext("webgl");

        //draw the maze contents according to board(see definition in board.js) (needs to be replaced later)
        let t = program_state.animation_time / 1000;
        let dt = program_state.animation_delta_time / 1000;

        if (this.timer_status)
        {
            this.timer += dt;
        }

        let model_transform = Mat4.identity();

        let maze = this.board.final_grid;

        for(let i = 0; i < this.board.final_grid.length; i++){
            for(let j = 0; j < this.board.final_grid[0].length; j++){
                this.draw_color_block(context, program_state, model_transform, i, j);
            }
        }

        this.draw_maze_ground(context, program_state);

        // Calculating color at mouse position
        const rect = canvas.getBoundingClientRect();

        var x = this.mouseX;
        var y = this.mouseY;

        x = x - rect.left;
        y = rect.bottom - y;
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel);

        gl.clear(gl.DEPTH_BUFFER_BIT);

        const x_block = this.pixel[1];
        const y_block = this.pixel[0];

        // Drawing board
        if (this.drawing_board === true) {
            if (this.wall_height <= 0.8) {
                this.wall_height += 0.05;
            } else {
                this.drawing_board = false;    
            }
        }

        // Highlighting block
        if (this.on_board(x_block, y_block) && !this.player_selected && !this.ball_selected) {
            if (this.hover_player(this.pixel[1], this.pixel[0])) {
                this.board.current_player_color = this.board.player_highlight_color;    

            } else if (this.hover_end(x_block, y_block)) {
                this.board.current_ball_color = this.board.ball_highlight_color;

            } else {
                maze[this.pixel[0]][this.pixel[1]].color = this.board.block_highlight_color;
                this.board.current_player_color = this.board.player_color;
                this.board.current_ball_color = this.board.ball_color;
            }
        } else {
            if (!this.player_selected) {
                this.board.current_player_color = this.board.player_color;
            }
            if (!this.ball_selected) {
                this.board.current_ball_color = this.board.ball_color;
            }
        }

        this.draw_maze_boarder(context, program_state, this.board_width*2, this.board_height*2); //draw a 40 x 30 area on x-z plane


        // Drawing ball
        
        if (this.ball_selected && this.on_board(x_block, y_block) && !maze[y_block][x_block].iswall && this.on_board(this.pixel[1], this.pixel[0])) {
            this.board.end_x = x_block;
            this.board.end_z = y_block;
        } 

        model_transform = get_model_translate_from_grid(this.board.end_z, this.board.end_x);
        let scale = maze[this.board.end_z][this.board.end_x].scale;
        model_transform = model_transform.times(Mat4.scale(scale, scale, scale));
        this.shapes.sphere.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: this.board.current_ball_color}));

        // Drawing each cube
        for(let i = 0; i < this.board.final_grid.length; i++){
            for(let j = 0; j < this.board.final_grid[0].length; j++){
                this.draw_board_object(context, program_state, model_transform, i, j);
            }
        }

        //run searching algorithm
        if(this.board.isRunningDFS){
            this.time_counter += dt;
            if(this.time_counter > this.board.time_interval_between_step){
                this.board.single_step_dfs();
                this.time_counter = 0;
            }
        }else if(this.board.isRunningGBF){
            this.time_counter += dt;
            if(this.time_counter > this.board.time_interval_between_step){
                this.board.single_step_greedy_best_first();
                this.time_counter = 0;
            }
        }
        if(this.board.isFoundEnd){
            this.board.isRunningDFS = false;
            this.board.isRunningGBF = false;
            this.time_counter += dt;
            if(this.time_counter > 1.0){ //wait for 1 sec before tracing the path 
                this.board.isTracingPath = true;
                this.time_counter = 0;
            }
        }

        //trace path 
        if(this.board.isTracingPath && !this.board.player.is_moving()){
            this.board.single_step_trace_path();
            this.board.path_index++;
        }
        this.board.update_grid_appearance(dt);

        //draw player
        if (this.player_selected && this.on_board(this.pixel[1], this.pixel[0]) && !maze[this.pixel[0]][this.pixel[1]].iswall) {
            this.board.player.set_position(this.pixel[1], this.pixel[0]);
            this.board.init_start_x = this.pixel[1];
            this.board.init_start_z = this.pixel[0];
        } 
        
        this.board.discrete_move_player(dt);

        if (this.board.final_grid[this.board.player.grid_z][this.board.player.grid_x].isEnd)
        {
            this.timer_status = false;
            this.particles_emitter.player_particle_emitter.add_particles(this.board.player.model_transform);
        }

        model_transform = (this.board.player.model_transform).times(Mat4.rotation(this.board.player.point_to, 0, 1, 0))
                                                             .times(Mat4.scale(this.board.player.scale, this.board.player.scale, this.board.player.scale));
        this.shapes.player.draw(context, program_state, model_transform, this.materials.plane.override(this.board.current_player_color));



        //add particle trace behind player when moving 
        if(this.board.player.is_moving()){
            //offset particle emitter behind player
            let initial_model_transform = this.board.player.model_transform;
            let scale = this.board.player.scale;
            if(this.board.player.isMovingE){
                initial_model_transform = initial_model_transform.times(Mat4.translation(-1*scale, 0, 0));
            }else if(this.board.player.isMovingW){
                initial_model_transform = initial_model_transform.times(Mat4.translation(1*scale, 0, 0));
            }else if(this.board.player.isMovingN){
                initial_model_transform = initial_model_transform.times(Mat4.translation(0, 0, 1*scale));
            }else if(this.board.player.isMovingS){
                initial_model_transform = initial_model_transform.times(Mat4.translation(0, 0, -1*scale));
            }
            //add more particles 
            this.particles_emitter.player_particle_emitter.add_particles(initial_model_transform);
        } 
        if(!this.particles_emitter.player_particle_emitter.is_empty()){
            this.particles_emitter.player_particle_emitter.update_particles(program_state);
            this.particles_emitter.player_particle_emitter.render(context, program_state);
        }

        const birds_eye_x = 20;
        const birds_eye_y = 80 + (this.board.grid_width * 2) + (this.board.grid_height * 2) - 40;
        const birds_eye_z = 30; 

        const side_view_x = 20;
        const side_view_y = 30;
        const side_view_z = 80 + (this.board.grid_width * 2) + (this.board.grid_height * 2) - 40;;

        let desired;
        switch (this.camera_angle) {
            case 'bird':
                desired = Mat4.look_at(vec3(birds_eye_x, birds_eye_y, birds_eye_z), vec3(20, 0, 25), vec3(0, 1, 0));
                break;
            case 'follow':
                desired = Mat4.inverse(model_transform.times(Mat4.rotation(this.board.player.point_to * -1, 0, 1, 0)).times(Mat4.rotation(-1 * (Math.PI/2), 1, 0, 0)).times(Mat4.translation(0, 0, 30)));
                break;
            default:
                desired = Mat4.look_at(vec3(side_view_x, side_view_y, side_view_z), vec3(20, 0, 25), vec3(0, 1, 0));
                break;
        }

        desired = desired.map((x, i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));

        program_state.set_camera(desired);

    }
}
