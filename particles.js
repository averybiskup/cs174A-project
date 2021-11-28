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
        this.model_tranform = model_tranform; //store the 'position of the particle'
    }

    is_dead(){
        return this.age >= this.life;
    }

    render(context, program_state){
        let dt = program_state.animation_delta_time / 1000;
        this.age+=dt;
        let scale_transform = Mat4.scale(this.scale, this.scale, this.scale);
        let dx = this.velocity.times(dt);
        let delta_translate = Mat4.translation(dx[0], dx[1], dx[2]);
        this.model_tranform = delta_translate.times(this.model_tranform)
        let final_model_tranform = this.model_tranform.times(scale_transform);
        this.shape.draw(context, program_state, final_model_tranform, this.material.override({color: this.color}));
    }
}


class Particles_emitter{
    constructor(max_particles, particle_scale, ave_particle_life, particle_color) {
        this.particles =  new Array(); //stores all the living particle for render
        this.max_particles = max_particles; //maximum number of particle at the same time 
        this.particle_scale = particle_scale; //particle scale 
        this.ave_particle_life = ave_particle_life; //average particle life span 
        this.particle_color = particle_color; //color of the particles
        this.shapes = {
            cube: new defs.Cube(),
        }
        this.materials = {
            white_plastic: new Material(new defs.Phong_Shader(), 
            {ambient: 1.0, diffusivity:.2, color: hex_color('#ffffff')}),
        }
    }

    is_empty(){
        return this.particles.length === 0;
    }

    add_particles(model_tranform){
        //add random number of particles to render queue
        let add_particles_count = rand_int(0, 3);
        for(let i = 0; i<add_particles_count; i++){
            //randomize particle velocity
            let x_velocity = -1 + 2*Math.random();
            let y_velocity = -1 + 2*Math.random();
            let z_velocity = -1 + 2*Math.random();
            //randomize lifespan 
            let life = this.ave_particle_life + 0.1*Math.random();
            //add new particle instance 
            if(this.particles.length < this,this.max_particles){
                this.particles.push(new Particle(this.shapes.cube, 
                                                 this.materials.white_plastic,
                                                 life, 
                                                 vec3(x_velocity, y_velocity, z_velocity),
                                                 this.particle_color,
                                                 this.particle_scale,
                                                 model_tranform))
            }
        }
    }

    update_particles(){
        for(let i = 0; i<this.particles.length; i++){
            if(this.particles[i].is_dead()){ //if the particle is dead remove that particle
                this.particles.splice(i, 1);
            }
        }
    }

    render(context, program_state){
        for(let i = 0; i<this.particles.length; i++){
            this.particles[i].render(context, program_state);
        }
    }
}

export { Particles_emitter };
