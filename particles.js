import {defs, tiny} from './examples/common.js';
import { rand_int } from './utilities.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//individual paricle
class Particle{
    constructor(shape, material, life, velocity, color, scale, model_tranform){
        this.shape = shape; //shape, could be square, cube sphere etc.
        this.material = material;// material of the particle
        this.age = 0;//age of this particle
        this.velocity = velocity; //velocity of the paricle, direction & speed; vec3 x y z 
        this.life = life; //lifespan of the particle 
        this.scale = scale;
        this.color = color; //color of the particle; vec4 normalized rgb
        this.euclidian_model_tranform = model_tranform; //store the 'position and orientation of the particle'
    }

    is_dead(){
        return this.age >= this.life;
    }

    update_particle(program_state){
        let dt = program_state.animation_delta_time / 1000;
        this.age+=dt; //increase age
        //calc displacement 
        let dx = this.velocity.times(dt); 
        let delta_translate = Mat4.translation(dx[0], dx[1], dx[2]);
        //add rotations to simulate randomness 
        let rotation = Mat4.rotation(dt*2*Math.PI, 0, 1, 0);//.times(Mat4.rotation(dt*2*Math.PI, 1, 0, 0)).times(Mat4.rotation(dt*2*Math.PI, 0, 0, 1));
        this.euclidian_model_tranform = delta_translate.times(this.euclidian_model_tranform).times(rotation);
    }

    get_final_model_transform(){
        //set scale according to age 
        let scale = this.scale*Math.max(0.5, (1 - this.age/this.life));
        let scale_transform = Mat4.scale(scale, scale, scale);
        let final_model_tranform = this.euclidian_model_tranform.times(scale_transform);
        return final_model_tranform;
    }

    render(context, program_state){
        this.shape.draw(context, program_state, this.get_final_model_transform(), this.material.override({color: this.color}));
    }
}

class Outline_Particle extends Particle{//special kind of particle: only consists of outlines 
    constructor(shape, material, life, velocity, color, scale, model_tranform){
        super(shape, material, life, velocity, color, scale, model_tranform);
    }

    render(context, program_state){
        this.shape.update_outline_color(this.color);
        this.shape.draw(context, program_state, this.get_final_model_transform(), this.material, 'LINES');
    }
}

class Particles_Emitter{
    constructor(max_spawn_rate, particle_scale, ave_particle_life, particle_color, max_x_speed, max_y_speed, max_z_speed) {
        this.particles =  new Array(); //stores all the living particle for render
        this.max_spawn_rate = max_spawn_rate; //maximum number of particle spawn at the same time 
        this.particle_scale = particle_scale; //particle scale 
        this.ave_particle_life = ave_particle_life; //average particle life span 
        this.particle_color = particle_color; //color of the particles
        //maximum speed of each particle
        this.max_x_speed = max_x_speed;
        this.max_y_speed = max_y_speed;
        this.max_z_speed = max_z_speed;
        //predefined particle shapes and materials 
        this.shapes = {
            cube: new defs.Cube(),
            cube_outline: new defs.Cube_Outline(),
        }
        this.materials = {
            white_plastic: new Material(new defs.Phong_Shader(), 
            {ambient: 1.0, diffusivity:.2, color: hex_color('#ffffff')}),
            outline: new Material(new defs.Basic_Shader()),
        }
    }

    is_empty(){
        return this.particles.length === 0;
    }

    add_particles(model_tranform){
        //add random number of particles to render queue
        let add_particles_count = rand_int(0, Math.max(2, this.max_spawn_rate));
        for(let i = 0; i<add_particles_count; i++){
            //randomize particle velocity
            let x_velocity = (-1 + 2*Math.random())*this.max_x_speed;
            let y_velocity = (-1 + 2*Math.random())*this.max_y_speed;
            let z_velocity = (-1 + 2*Math.random())*this.max_z_speed;
            //randomize lifespan 
            let life = this.ave_particle_life + 0.1*Math.random();
            //add new particle instance 
            //randomly add outline particle or normal particles
            let is_outline = (Math.random() >= 0.75?true:false);
            if(is_outline){
                this.particles.push(new Outline_Particle(this.shapes.cube_outline, 
                                                this.materials.outline,
                                                life, 
                                                vec3(x_velocity, y_velocity, z_velocity),
                                                this.particle_color,
                                                this.particle_scale,
                                                 model_tranform));
            }else{
                this.particles.push(new Particle(this.shapes.cube, 
                                                this.materials.white_plastic,
                                                life, 
                                                vec3(x_velocity, y_velocity, z_velocity),
                                                this.particle_color,
                                                this.particle_scale,
                                                model_tranform));
            }
        }
    }

    update_particles(program_state){
        for(let i = 0; i<this.particles.length; i++){
            if(this.particles[i].is_dead()){ //if the particle is dead remove that particle
                this.particles.splice(i, 1);
            }else{
                this.particles[i].update_particle(program_state)
            }
        }
    }

    render(context, program_state){
        for(let i = 0; i<this.particles.length; i++){
            this.particles[i].render(context, program_state);
        }
    }
}

export { Particles_Emitter };
