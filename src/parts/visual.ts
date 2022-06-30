import { Composite } from "matter-js";
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { Mesh } from 'three/src/objects/Mesh';
import { Color } from 'three/src/math/Color';
import { Param } from "../core/param";
import { Vector3 } from 'three/src/math/Vector3';
import { BufferAttribute } from 'three/src/core/BufferAttribute';
import { Util } from "../libs/util";
import { TubeGeometry } from 'three/src/geometries/TubeGeometry';
import { CatmullRomCurve3 } from 'three/src/extras/curves/CatmullRomCurve3';

export class Visual extends Canvas {

  private _con: Object3D;
  private _line:Array<Mesh> = [];

  constructor(opt: any) {
    super(opt);

    this._con = new Object3D()
    this.mainScene.add(this._con)

    const num = opt.link.length;
    for(let i = 0; i < num; i++) {
      const line = new Mesh(
        this._makeLineGeo([new Vector3(0,0,0), new Vector3(1,0,0), new Vector3(2,0,0)]),
        new MeshBasicMaterial({
          color:opt.link[i].color,
          depthTest:false,
        }),
      )
      this._con.add(line);
      this._line.push(line);
    }

    this._resize()
  }



  public updatePos(stack:Array<Composite>): void {
    // 物理演算結果をパーツに反映
    const offsetX = -this.renderSize.width * 0.5
    const offsetY = this.renderSize.height * 0.5

    stack.forEach((val,i) => {
      const line = this._line[i];
      let basePos:Array<Vector3> = [];
      val.bodies.forEach((val2) => {
        const pos = val2.position;
        basePos.push(new Vector3(pos.x + offsetX, pos.y * -1 + offsetY, 0));
      });

      line.geometry.dispose();
      line.geometry = this._makeLineGeo(basePos);
    })
  }


  protected _update(): void {
    super._update()

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    const bgColor = new Color(Param.instance.main.bg.value)
    this.renderer.setClearColor(bgColor, 1)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }


  // ---------------------------------
  //
  // ---------------------------------
  private _makeLineGeo(basePos:Array<Vector3>):TubeGeometry {
    const arr:Array<Vector3> = []

    basePos.forEach((val) => {
      arr.push(val)
    });

    const sampleClosedSpline = new CatmullRomCurve3(arr, false);

    const tube = new TubeGeometry(sampleClosedSpline, 64, 2, 12, false);

    const num = tube.attributes.position.count
    const order = new Float32Array(num * 3)
    let i = 0
    while(i < num) {
      order[i*3+0] = Util.instance.map(i, 0, 1, 0, num - 1)
      order[i*3+1] = 0
      order[i*3+2] = 0
      i++
    }
    tube.setAttribute('order', new BufferAttribute(order, 3));

    return tube
  }

}
