class Path {
  constructor (pathstr) {
    if (!pathstr) this.arr = [];
    else this.arr = pathstr.split('/');
  }

  get level () {
    return this.arr.length;
  }

  get dirname () {
    return this.arr.slice(0, this.level-1).join('/');
  }

  get basename () {
    return this.arr[this.level-1];
  }

  get extname () {
    let x = this.basename.split('.');
    return x[x.length-1];
  }

  append (p2) {
    this.arr.push(...p2.arr);
  }
}

class Inode {
  constructor (name, content) {
    this.name = name;
    this.content = content;
  }

  get type () {
    if (this.content instanceof Map) return 'directory';
    else return 'file';
  }
  
  dumps () {
    return JSON.stringify(this.dump(), null, 2);
  }
}

class File extends Inode {
  constructor (name) {
    super(name, '');
  }

  read () {
    return this.content;
  }

  write (str) {
    str = str.toString();
    this.content = str;
  }
  
  dump () {
    let obj = Object.create(null);
    obj.type = this.type;
    obj.name = this.name;
    obj.content = this.content;
    return obj;
  }
}

class Directory extends Inode {
  constructor (name, par) {
    super (name, new Map());
    this.par = par;
    this.content.set('.', this);
    this.content.set('..', this.par);
    this.content.set('/', this.root);
  }
  get root () { return this.par.root; }
  
  mkdir (name) {
    if (!this.content.has(name)) this.content.set(name, new Directory (name, this) );
    return this.content.get(name);
  }

  touch (name) {
    if (!this.content.has(name)) this.content.set(name, new File (name) );
    return this.content.get(name);
  }

  rm (name) {
    if (this.content.has(name)) this.content.delete(name);
  }

  ls () {
    let x = [];
    for (let y of this.content.keys()) x.push(y);
    return x;
  }

  get (name) {
    if (this.content.has(name)) return this.content.get(name);
    return false;
  }
  
  mount (name, fs) {
    this.content.set(name, new Directory (name, this));
    this.content.get(name).content = fs.content;
    return this.content.get (name);
  }

  dump () {
    let obj = Object.create(null);
    obj.type = this.type;
    obj.name = this.name;
    obj.content = [];
    for (let node of this.content.keys()) {
      if (node === '.' || node === '..' || node === '/') continue;
      obj.content.push(this.content.get(node).dump());
    }
    return obj;
  }

  load (contentArr) {
    for (let node of contentArr) {
      if (node.type === 'file') this.touch(node.name).write(node.content);
      else if (node.type === 'directory') this.mkdir (node.name).load(node.content);
      else continue;
    }
  }
}

class Jsonfs extends Directory {
  constructor (name) {
    super (name, null);
  }
  get root () {
    return this;
  }

  resolve (path) {
    let p = new Path(path);
    let x = null;
    for (let d of p.arr) {
      if (d==='') x = this.root;
      else x = x.get(d);
    }
    return x;
  }

  readFile (path) {
    return this.resolve(path).read();
  }

  static load (obj)  {
    let fs = new Jsonfs (obj.name);
    fs.load(obj.content);
    return fs;
  }

  static loads (str) {
    return Jsonfs.load(JSON.parse(str));
  }
}


function test () {
  let fs0 = new Jsonfs ('root');
  let testdir = fs0.mkdir('test');
  let testfile = testdir.touch ('test.is');
  testfile.write ('This is a test file');
  
  let fs1 = Jsonfs.loads(fs0.dumps());
  console.log (fs1.readFile('/test/../test/./test.is'));
}

test();
