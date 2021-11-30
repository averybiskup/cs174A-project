import {defs, tiny} from './examples/common.js';
import {Board} from './board.js';
import { get_model_transform_from_grid } from './utilities.js';

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
                {ambient: 1.0, diffusivity:.2, color: hex_color('#ffffff')}),
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

        this.animation_queue = [];

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

    mouse_click (e, pos) {
        var x = e.clientX;
        var y = e.clientY;
        
        this.mouseX = x;
        this.mouseY = y;
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.look_at(vec3(20, 40, 30), vec3(20, 0, 10), vec3(0, 1, 0)));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 200);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(10, 10, 50, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        this.draw_maze_ground(context, program_state);
        this.draw_maze_boarder(context, program_state, this.board_width*2, this.board_height*2); //draw a 40 x 30 area on x-z plane
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
        this.time_counter = 0;

        this.prevPickedX = -1;
        this.prevPickedY = -1;
    }

    make_control_panel() {

        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.

        //for discrete movement testing purpose
        this.key_triggered_button("Move 1 grid N", ["i"], () => this.board.player.isMovingN = true);
        this.key_triggered_button("Move 1 grid S", ["k"], () => this.board.player.isMovingS = true);
        this.key_triggered_button("Move 1 grid W", ["j"], () => this.board.player.isMovingW = true);
        this.key_triggered_button("Move 1 grid E", ["l"], () => this.board.player.isMovingE = true);

        this.key_triggered_button("Run DFS", ['x'], () => this.board.isRunningDFS = true); //visualize dfs
    }

    display(context, program_state) {
        super.display(context, program_state);

        let canvas = context.canvas;
        const gl = canvas.getContext("webgl");
        
        //draw the maze contents according to board(see definition in board.js) (needs to be replaced later)
        let t = program_state.animation_time / 1000;
        let dt = program_state.animation_delta_time / 1000;

        let maze = this.board.final_grid;

        let model_transform = Mat4.identity();
        for(let i = 0; i < this.board.final_grid.length; i++){
            for(let j = 0; j < this.board.final_grid[0].length; j++){
                if (maze[i][j].iswall) { //draw wall
                    model_transform = get_model_transform_from_grid(i, j);
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
                }
                else {
                    model_transform = get_model_transform_from_grid(i, j);
                    let scale = maze[i][j].scale;
                    model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
                    this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_picker_plastic.override({color: color(i/255, j/255, .1, 1.0)}));
                }
            }
        }

        const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect()
            this.mouse_click(e, mouse_position(e), context, program_state);
        });
        
        var x = this.mouseX;
        var y = this.mouseY;
        var rect = context.canvas.getBoundingClientRect();

        x = x - rect.left;
        y = rect.bottom - y;

        var pixel = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        
        //console.log("picked: " + pixel);
        
        this.pickedX = pixel[1];
        this.pickedY = pixel[0];

        //console.log("x: " + this.pickedX + " y: " + this.pickedY);

        if (this.pickedX != this.prevPickedX && this.pickedY != this.prevPickedY &&
            this.pickedX >= 0 && this.pickedX <= maze.length - 1 &&
            this.pickedY >= 0 && this.pickedY <= maze.length - 1)
        {
            console.log("x: " + this.pickedX + " y: " + this.pickedY);
            this.board.toggle_grid_wall(this.pickedX, this.pickedY);
            this.prevPickedX = this.pickedX;
            this.prevPickedY = this.pickedY;
        }

        gl.clear(gl.DEPTH_BUFFER_BIT);
        
        //draw maze 
        model_transform = Mat4.identity();
        for(let i = 0; i < this.board.final_grid.length; i++){
            for(let j = 0; j < this.board.final_grid[0].length; j++){
//                 if (maze[i][j].iswall) { //draw wall
//                     model_transform = get_model_transform_from_grid(i, j);
//                     this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: maze[i][j].color}));
//                 }
//                 else {
//                     model_transform = get_model_transform_from_grid(i, j);
//                     let scale = maze[i][j].scale;
//                     model_transform = model_transform.times(Mat4.scale(scale, 0.01, scale)).times(Mat4.translation(0, -100, 0));
//                     this.shapes.cube.draw(context, program_state, model_transform, this.materials.ground.override({color: maze[i][j].color}));
//                 }
                if(maze[i][j].isEnd) { //draw end 
                    model_transform = get_model_transform_from_grid(i, j);
                    this.shapes.sphere.draw(context, program_state, model_transform, this.materials.grey_plastic.override({color: maze[i][j].color}));
                }
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
        model_transform = (this.board.player.model_transform).times(Mat4.rotation(this.board.player.point_to, 0, 1, 0));
        this.shapes.player.draw(context, program_state, model_transform, this.materials.plane);
        
        /*
        var mouseX;
        var position;
        
        canvas.addEventListener("mouseclick", e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect()
            /*
            console.log("e.clientX: " + e.clientX);
            console.log("e.clientX - rect.left: " + (e.clientX - rect.left));
            console.log("e.clientY: " + e.clientY);
            console.log("e.clientY - rect.top: " + (e.clientY - rect.top));
            console.log("mouse_position(e): " + mouse_position(e));
            
            
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
            vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

            this.mouse_move(e, mouse_position(e), context, program_state);

//             const pixelX = mouseX * canvas.width / canvas.clientWidth;
//             const pixelY = canvas.height - mouseY * canvas.height / canvas.clientHeight - 1;

//             var x = mouse_position[0];
//             var y = mouse_position[1];

//             x = x - rect.left;
//             y = rect.bottom - y;
            mouseX = e;
            position = e;

            var pixel = new Uint8Array(4);
            //gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            //console.log("position" + mouse_position);
            //console.log("picked: " + pixel);
        });
        */
       
//         var mouse_position = (e, rect = canvas.getBoundingClientRect ()) => {
//             vec (e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
//         }

//         const pixelX = this.mouseX * canvas.width / canvas.clientWidth;
//         const pixelY = canvas.height - this.mouseY * canvas.height / canvas.clientHeight - 1;
    }
}