import { Composite } from "matter-js";
import { MyDisplay } from "../core/myDisplay";
import { Tween } from "../core/tween";
import { Color } from 'three/src/math/Color';
import { Util } from "../libs/util";

// -----------------------------------------
//
// -----------------------------------------
export class Link extends MyDisplay {

  private _item:Array<HTMLElement> = []
  public txtNum:number = 0;
  public color:Color = new Color(Util.instance.random(0,1), Util.instance.random(0,1), Util.instance.random(0,1));

  constructor(opt:any) {
    super(opt)

    let txt = this.getEl().innerHTML
    this.getEl().innerHTML = ''

    let arr = Array.from(txt)
    let i = 0
    this.txtNum = arr.length;
    while (i < arr.length) {
      const el = document.createElement('span')
      el.classList.add('-no' + i)
      el.innerHTML = arr[i]
      this.getEl().append(el)
      this._item.push(el)
      i++
    }

    Tween.instance.set(this.getEl(), {
      color:'#' + this.color.getHexString()
    })
  }


  init() {
      super.init()
  }


  //
  public update(stack:Composite) {
    const offset = this.getOffset(this.getEl());
    const offsetSize = this.getRect(this.getEl());

    stack.bodies.forEach((val,i) => {
      const item = this._item[i];
      const p = val.position;
      Tween.instance.set(item, {
        y:p.y - offset.y - offsetSize.height
      })
    })
  }
}