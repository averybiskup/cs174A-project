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
                               this.board_height/2);
        this.particles_emitter = {
            player_particle_emitter: new Particles_Emitter(2, 0.28, 0.3, vec4(1, 1, 1, 1), 3, 1, 3),
        }
        this.time_counter = 0;
        this.drawing_board = true;
        this.current_x = 0;
        this.current_y = 0;
        this.camera_angle = 'side';

        this.listeners_added = false;
        this.pixel = new Uint8Array(4);
    }

    add_listeners(canvas) {
        this.listeners_added = true;
        
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

        });

        canvas.addEventListener("mouseup", e => {
            e.preventDefault();

            if (this.pixel[0] >= 0 
                && this.pixel[0] <= this.board_width
                && this.pixel[1] >= 0
                && this.pixel[1] <= this.board_width) {
                
                console.log(this.pixel)
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
    resetBoard() {
        this.board = new Board(this.board_width/2, this.board_height/2);    
        this.current_x = 0;
        this.current_y = 0;
        this.drawing_board = true;
    }

    // Resetting x size of board
    resetX(value) {
        if (this.board_width >= 5 && this.board_width <= 40) {
            this.board_width += value;
            this.board.grid_width += value;
            this.resetBoard();
        }
    }

    // Resetting y size of board
    resetY(value) {
        if (this.board_height >= 5 && this.board_height <= 40) {
            this.board.grid_height += value;
            this.board_height += value;
            this.resetBoard();
        }
    }

    make_control_panel() {

        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.

        //for discrete movement testing purpose
        this.key_triggered_button("Move 1 grid N", ["i"], () => this.board.player.isMovingN = true);
        this.key_triggered_button("Move 1 grid S", ["k"], () => this.board.player.isMovingS = true);
        this.key_triggered_button("Move 1 grid W", ["j"], () => this.board.player.isMovingW = true);
        this.key_triggered_button("Move 1 grid E", ["l"], () => this.board.player.isMovingE = true);

        this.key_triggered_button("Run DFS", ['x'], () => this.board.isRunningDFS = true); //visualize dfs
        
        // Restart algorithm
        this.key_triggered_button("Reset", ['x'], () => this.resetBoard() ); //visualize dfs

        this.key_triggered_button("Decrease x", ['<'], () => this.resetX(-2) ); //visualize dfs
        this.key_triggered_button("Increase x", ['>'], () => this.resetX(2) ); //visualize dfs
        this.key_triggered_button("Decrease y", ['-'], () => this.resetY(-2) ); //visualize dfs
        this.key_triggered_button("Increase y", ['+'], () => this.resetY(2) ); //visualize dfs

        this.key_triggered_button("Birds View", ['b'], () => this.camera_angle = 'bird' ); //visualize dfs
        this.key_triggered_button("Side View", ['.'], () => this.camera_angle = 'side' ); //visualize dfs
        this.key_triggered_button("Follow", ['c'], () => this.camera_angle = 'follow' ); //visualize dfs
    }

    draw_board_object(context, program_state, model_transform, i, j) {
        const maze = this.board.final_grid
        if (maze[i][j].iswall) { //draw wall
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, scale, scale));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: maze[i][j].color}));
        }
        else {
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.white_plastic.override({color: maze[i][j].color}));
        }

        if(maze[i][j].isEnd) { //draw end 
            model_transform = get_model_translate_from_grid(i, j);
            let scale = maze[i][j].scale;
            model_transform = model_transform.times(Mat4.scale(scale, scale, scale));
            this.shapes.sphere.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: maze[i][j].color}));
        }
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

        let model_transform = Mat4.identity();

        let maze = this.board.final_grid;

        for(let i = 0; i < this.board.final_grid.length; i++){
            for(let j = 0; j < this.board.final_grid[0].length; j++){
                if (maze[i][j].iswall) { //draw wall
                        model_transform = get_model_translate_from_grid(i, j).times(Mat4.scale(0.8, 0.8, 0.8));
                        this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
                }
                else if(!maze[i][j].isPlayer && !maze[i][j].isEnd && maze[i][j].isShown){
                    model_transform = get_model_translate_from_grid(i, j);
                    let scale = maze[i][j].scale;
                    model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
                }
            }
        }

        this.draw_maze_ground(context, program_state);

        const rect = canvas.getBoundingClientRect();

        var x = this.mouseX;
        var y = this.mouseY;

        x = x - rect.left;
        y = rect.bottom - y;
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel);

        gl.clear(gl.DEPTH_BUFFER_BIT);

        if (this.pixel[1] >= 0 && this.pixel[1] <= maze.length && this.pixel[0] >= 0 && this.pixel[0] <= maze.length) {
            maze[this.pixel[0]][this.pixel[1]].color = color(1.0, 0, 0, 1.0);
        }

        this.draw_maze_boarder(context, program_state, this.board_width*2, this.board_height*2); //draw a 40 x 30 area on x-z plane

        // Drawing board
        if (this.drawing_board === true) {
            if (this.current_y < this.board.final_grid.length) {
                this.current_y += 1;
            } 
            if (this.current_x < this.board.final_grid[0].length) {
                this.current_x += 1;
            } 
            if (this.current_x === this.board.final_grid[0].length && this.current_y === this.board.final_grid.length) {
                this.drawing_board = false;    
            }
        }

        // Drawing each cube
        for (let i = 0; i < this.current_y; i++) {
            for (let j = 0; j < this.current_x; j++) {
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
        }
        if(this.board.isFoundEnd){
            this.board.isRunningDFS = false;
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
        this.board.discrete_move_player(dt);
        model_transform = (this.board.player.model_transform).times(Mat4.rotation(this.board.player.point_to, 0, 1, 0))
                                                             .times(Mat4.scale(this.board.player.scale, this.board.player.scale, this.board.player.scale));
        this.shapes.player.draw(context, program_state, model_transform, this.materials.plane);
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
