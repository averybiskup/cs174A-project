import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// Method for returning random number between range (min, max)
function rand_int(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

//generate model_tranform according to grid coordinate 
function get_model_translate_from_grid(i, j){ //helper function for transforming unit cube or sphere from model to world space
    let model_transform = Mat4.identity();

    const translation_factor = 2;
    const z_translation = i * translation_factor;
    const x_translation = j * translation_factor;

    model_transform = model_transform.times(Mat4.translation(x_translation + 1, 1, z_translation + 1));

    return model_transform;
}


export {rand_int, get_model_translate_from_grid};