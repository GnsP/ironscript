/**
 * Copyright (c) 2016 Ganesh Prasad Sahoo (GnsP)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 *
 */


import {nextTick} from 'async-es';
import Parser from './parser.js';
import evalAsync from './evalAsync.js';

export function importfn (env) {
  let readSource = env.map.get('_readsource');
  let imported = new Map();
  return (err, _env, cb, sourcename) => {
    if (imported.has(sourcename)) nextTick (cb, null, _env, null, imported.get(sourcename));
    else {
      nextTick (readSource, err, _env, (err, __env, _cb, src) => {
        let p = new Parser ({name:sourcename, buffer:src});
        nextTick (evalAsync, p.parse(), env, (err, _env_, _cb, val) => {
          imported.set (sourcename, _env_);
          nextTick (cb, null, _env, null, _env_);
        });
      } , sourcename);
    }
  }
}

export function includefn (env) {
  let readsource = env.map.get('_readsource');
  let included = new Map();
  let src = null;
  return (err, _env, cb, sourcename) => {
    if (included.has(sourcename)) { 
      src = included.get(sourcename);
      let p = new Parser({name: sourcename, buffer: src});
      nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
        nextTick (cb, null, _env, null, null);
      });
    }
    else {
      nextTick (readsource, err, _env, (err, __env, _cb, src) => {
        included.set(sourcename, src);
        let p = new Parser({name: sourcename, buffer: src});
        nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
          nextTick (cb, null, _env, null, null);
        });
      }, sourcename);
    }
  }
}


