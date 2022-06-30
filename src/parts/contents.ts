
import { Bodies, Body, Composite, Composites, Constraint, Engine, Events, Render, Runner } from "matter-js";
import { Conf } from "../core/conf";
import { Func } from "../core/func";
import { Mouse } from "../core/mouse";
import { MyDisplay } from "../core/myDisplay";
import { Link } from "./link";
import { Visual } from "./visual";

// -----------------------------------------
//
// -----------------------------------------
export class Contents extends MyDisplay {

  public engine:Engine;
  public render:Render;

  // マウス用
  private _mouse:Body;

  private _stack:Array<Composite> = [];

  // リンク部分
  private _link:Array<Link> = [];

  // ビジュアル用
  private _v:Visual;

  constructor(opt:any) {
    super(opt)

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    // エンジン
    this.engine = Engine.create();

    // 重力方向変える
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;

    // レンダラー
    this.render = Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        width: sw,
        height: sh,
        showAngleIndicator: false,
        showCollisions: false,
        showVelocity: false,
        pixelRatio:0.1
      }
    });
    this.render.canvas.classList.add('matter')

    // リンク部分
    document.querySelectorAll('.l-text > a').forEach((val) => {
      const link = new Link({
        el:val
      })
      this._link.push(link)
    })

    for(let i = 0; i < this._link.length; i++) {
      const link = this._link[i];

      const samplePos = this.getOffset(link.getEl())
      const sampleSize = this.getRect(link.getEl())

      const amari = sampleSize.height * 0.25

      const x = samplePos.x - amari;
      const x2 = x + sampleSize.width + amari * 2;

      const y = samplePos.y + sampleSize.height;
      const y2 = y;

      const stiffness = 0.2

      let group = Body.nextGroup(true);
      const bridge = Composites.stack(x, y, link.txtNum, 1, 0, 0, function(x:number, y:number) {
        return Bodies.rectangle(x, y, Conf.instance.ITEM_SIZE * 1, Conf.instance.ITEM_SIZE, {
            collisionFilter: { group: group },
            density: 0.5,
            frictionAir: 0.005,
            render: {
                fillStyle: '#060a19',
                visible: false
            }
        });
      });
      Composites.chain(bridge, 0.3, 0, -0.3, 0, {
        stiffness: stiffness,
        length: 0,
        render: {
          visible: false
        }
      });
      Composite.add(this.engine.world, [
        bridge,
        Constraint.create({
            pointA: { x: x, y: y },
            bodyB: bridge.bodies[0],
            pointB: { x: 0, y: 0 },
            length: 2,
            stiffness: stiffness,
            render: {
              visible: false
            }
        }),
        Constraint.create({
            pointA: { x: x2, y: y2 },
            bodyB: bridge.bodies[bridge.bodies.length - 1],
            pointB: { x: 0, y: 0 },
            length: 2,
            stiffness: stiffness,
            render: {
              visible: false
            }
        })
      ]);
      this._stack.push(bridge);
    }

    // マウス
    const mouseSize =  Math.max(sw, sh) * Func.instance.val(0.1, 0.05)
    this._mouse = Bodies.circle(0, 0, mouseSize, {isStatic:true, render:{visible:false}});
    Composite.add(this.engine.world, [
      this._mouse,
    ]);
    Body.setPosition(this._mouse, {x:9999, y:9999});

    // ビジュアル
    this._v = new Visual({
      el:this.getEl(),
      link:this._link
    })

    // run the renderer
    Render.run(this.render);

    // create runner
    const runner:Runner = Runner.create();

    // run the engine
    Runner.run(runner, this.engine);

    // 描画後イベント
    Events.on(this.render, 'afterRender', () => {
      this._eAfterRender();
    })

    this._resize();
  }


  private _eAfterRender(): void {
    // ビジュアル更新
    this._v.updatePos(this._stack);

    // リンク部分動かす
    this._stack.forEach((val,i) => {
      this._link[i].update(val);
    })
  }



  protected _update(): void {
    super._update();

    let mx = Mouse.instance.x
    let my = Mouse.instance.y

    if(Conf.instance.USE_TOUCH && Mouse.instance.isDown == false) {
      mx = 9999
      my = 9999
    }

    // マウス位置に合わせる
    Body.setPosition(this._mouse, {x:mx, y:my});
  }


  protected _resize(): void {
    super._resize();

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    this.render.canvas.width = sw;
    this.render.canvas.height = sh;
  }
}