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

//custom minheap for greedy best first 
class Min_Heap{
    constructor(){
        this.container = new Array(); //2D array of the form [['movement', x, z, dis], ...]
    }

    //helpers
    _switch(index_a, index_b){
        let temp = this.container[index_a];
        this.container[index_a] = this.container[index_b];
        this.container[index_b] = temp;
    }

    _parent_index(index){ //return parent of this index 
        return Math.floor((index - 1)/2);
    }

    _left_child_index(index){
        return index*2 + 1;
    }

    _right_child_index(index){
        return index*2 + 2;
    }

    _is_in_bound(index){
        return index < this.container.length;
    }

    _bubble_up(index){
        if(index === 0){//already at top 
            return;
        }
        let parent_index = this._parent_index(index);
        let parent_dis = this.container[parent_index][3];
        let current_dis = this.container[index][3];
        if(parent_dis <= current_dis){
            return;
        }
        this._switch(parent_index, index);
        this._bubble_up(parent_index);
    }

    _bubble_down(index){
        if(index === this.container.length - 1){ //already at buttom
            return;
        }
        let left_child_index = this._left_child_index(index);
        left_child_index = this._is_in_bound(left_child_index)?left_child_index:index; //set to the index itself if out of bound since it will not affect later computation
        let left_child_dis = this.container[left_child_index][3];
        let right_child_index = this._right_child_index(index);
        right_child_index = this._is_in_bound(right_child_index)?right_child_index:index; //^^^
        let right_child_dis = this.container[right_child_index][3];
        let current_dis = this.container[index][3];
        if(current_dis <= left_child_index && current_dis <= right_child_index){
            return;
        }else if(left_child_dis < current_dis){
            this._switch(left_child_index, index);
            this._bubble_down(left_child_index);
        }else if(right_child_dis < current_dis){
            this._switch(right_child_index, index);
            this._bubble_down(right_child_index);
        }
    }

    pop(){
        let result = this.container[0];
        let last_element = this.container.pop();
        if(this.container.length === 0){
            return result;
        }
        this.container[0] = last_element;
        this._bubble_down(0);
        return result;
    }

    push(element){ //element is array of the form ['movement', x, z, dis]
        this.container.push(element);
        if(this.container.length === 1){//only one element
            return;
        }
        let element_index = this.container.length - 1;
        this._bubble_up(element_index);
    }

    root(){//return root node
        if(!this.is_empty()){
            return this.container[0];
        }
        return null;
    }

    is_empty(){
        return this.container.length === 0;
    }
}


export {rand_int, get_model_translate_from_grid, Min_Heap};
