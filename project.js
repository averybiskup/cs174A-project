import {defs, tiny} from './examples/common.js';
import {Board} from './board.js';

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
        }
        // *** Materials
        this.materials = { //all materials are place holder for demo
            ground: new Material(new defs.Phong_Shader(),
                {ambient: .9, diffusivity: .6, color: hex_color("#ffffed")}),
            white_plastic: new Material(new defs.Phong_Shader(), 
                {ambient: 1.0, diffusivity:.2, color: hex_color('#ffffff')}),
            grey_plastic: new Material(new defs.Phong_Shader(),
                {ambient:.6, diffusivity: .6, color: hex_color('#808080')}),
            plane: new Material(new defs.Phong_Shader(), 
                {ambient: .8, diffusivity: .6, color: hex_color('#ff9c8c')}),
        };
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
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.white_plastic);
        model_transform = model_transform.times(Mat4.translation(width+2, 0, 0));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.white_plastic);
        model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.translation(-2.0, 0, 0))
                                         .times(Mat4.scale(width/2+2, 1.0, 1.0))
                                         .times(Mat4.translation(1.0, 1.0, -1.0));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.white_plastic);
        model_transform = model_transform.times(Mat4.translation(0, 0, height+2));
        this.shapes.boarder.draw(context, program_state, model_transform, this.materials.white_plastic);
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
        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        this.draw_maze_ground(context, program_state);
        this.draw_maze_boarder(context, program_state, 40, 30); //draw a 40 x 30 area on x-z plane
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
        //generate a 20x15 maze and randomly place start and end point
        this.board = new Board(20, 15, Math.floor(Math.random() * 20), Math.floor(Math.random() * 15), Math.floor(Math.random() * 20), Math.floor(Math.random() * 15));
    }

    make_control_panel() {

        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Test", ["c"], () => console.log('test'));
    }

    get_model_transform_from_grid(i, j){ //helper function for transforming unit cube or sphere from model to world space
        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.translation(1 + i*2, 1, 1 + j*2))
                                         .times(Mat4.scale(0.8, 0.8, 0.8));                                               ;
        return model_transform;
    }

    display(context, program_state) {
        super.display(context, program_state);
        //draw the maze contents according to board(see definition in board.js) (needs to be replaced later)
        for(let i = 0; i < this.board.grid_width; i++){
            for(let j = 0; j < this.board.grid_height; j++){
                let model_transform = this.get_model_transform_from_grid(i, j);
                let maze_object = this.board.grid[i][j];
                switch(maze_object){
                    case 'B': this.shapes.cube.draw(context, program_state, model_transform, this.materials.grey_plastic);
                        break;
                    case 'W': this.shapes.cube.draw(context, program_state, model_transform, this.materials.white_plastic);
                        break;
                    case 'E': this.shapes.sphere.draw(context, program_state, model_transform, this.materials.grey_plastic);
                        break;
                    case 'S': this.shapes.plane.draw(context, program_state, model_transform, this.materials.plane);
                        break;
                    default:
                        break;
                }
            }
        }
        //let t = program_state.animation_time / 1000;
    }
}
