import Tile from 'ol/Tile.js';
import TileState from 'ol/TileState.js';
import { createCanvasContext2D } from 'ol/dom.js';
import { listenImage } from 'ol/Image.js';

import { PALETTE } from '@data/constants/palette';

class ImageTileCubiertasMod extends Tile {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options=} opt_options Tile options.
   */

  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {
    super(tileCoord, state, opt_options);

    /**
     * @private
     * @type {?string}
     */
    this.crossOrigin_ = 'Anonymous';
    this.palette = PALETTE.ironPalette;

    /**
     * Image URI
     *
     * @private
     * @type {string}
     */
    this.src_ = src;

    this.key = src;

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement}
     */
    this.image_ = new Image();
    if (crossOrigin !== null) {
      this.image_.crossOrigin = crossOrigin;
    }

    /**
     * @private
     * @type {?function():void}
     */
    this.unlisten_ = null;

    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    this.tileLoadFunction_ = tileLoadFunction;
  }

  /**
   * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   * @api
   */

  setImageSource(src) {
    this.imageSource = src;
  }

  getImage() {
    // this.image_.src = this.imageSource;
    if (this.imageLoaded == undefined) {
      this.sliderMin = this.thermalService.sliderMin[this.index];
      this.sliderMax = this.thermalService.sliderMax[this.index];
      this.imageLoaded = true;
      // this.imageRaw_.src = this.src_;
      return this.image_;
    } else {
      if (this.lastCanvas_ == undefined) {
        this.lastCanvas_ = this.transformPixels_(this.image_);
        return this.lastCanvas_;
      }

      // Si el slider no ha cambiado
      if (
        this.sliderMax == this.thermalService.sliderMax[this.index] &&
        this.sliderMin == this.thermalService.sliderMin[this.index]
      ) {
        return this.lastCanvas_;
      } else {
        this.sliderMin = this.thermalService.sliderMin[this.index];
        this.sliderMax = this.thermalService.sliderMax[this.index];
        this.lastCanvas_ = this.transformPixels_(this.image_);
        return this.lastCanvas_;
      }
    }
  }

  /**
   * Tracks loading or read errors.
   *
   * @private
   */
  handleImageError_() {
    this.state = TileState.ERROR;
    this.unlistenImage_();
    this.image_ = getBlankImage();
    this.changed();
  }

  /**
   * Tracks loading or read errors.
   *
   * @private
   */
  drawImage_(image, canvas) {
    // Set the canvas the same width and height of the image
    canvas.width = image.width;
    canvas.height = image.height;

    canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
    return canvas;
  }

  temp2palette_(temperatura) {
    const index = Math.round(
      ((this.palette.length - 1) / (this.sliderMax - this.sliderMin)) * (temperatura - this.sliderMin)
    );

    if (index > this.palette.length - 1) {
      return this.palette[this.palette.length - 1];
    }
    if (temperatura < this.sliderMin) {
      return this.palette[0];
    }

    return this.palette[index];
  }

  rgb2temp_(pixel) {
    if (this.thermalLayer.codificationType === undefined || this.thermalLayer.codificationType === 'rgb') {
      const precision = 0.1;
      const gradosMantenerPrecision = 255 * precision;

      let max;
      let min;
      let val;
      let maxVal = 0;
      if (pixel[0] > maxVal) {
        maxVal = pixel[0];
      }
      if (pixel[1] > maxVal) {
        maxVal = pixel[1];
      }
      if (pixel[2] > maxVal) {
        maxVal = pixel[2];
      }

      const subrango = Math.round(10 * gradosMantenerPrecision) / 10;

      if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
        return this.rangeTempMin;
      } else if (pixel[0] == 255 && pixel[1] == 255 && pixel[2] == 255) {
        return this.rangeTempMax;
      } else if (pixel[0] == maxVal) {
        max = this.rangeTempMin + subrango;
        min = this.rangeTempMin;
        val = pixel[0];
      } else if (pixel[1] == maxVal) {
        min = this.rangeTempMin + subrango;
        max = this.rangeTempMin + 0.1 * Math.round(10 * 2 * subrango);
        val = pixel[1];
      } else {
        max = this.rangeTempMax;
        min = this.rangeTempMin + 0.1 * Math.round(10 * 2 * subrango);
        val = pixel[2];
      }
      const temp = 0.1 * Math.round(10 * ((val * (max - min)) / 255 + min));

      return temp;
    } else if (this.thermalLayer.codificationType === 'rainbowHc') {
      const centenas = 255 - pixel[0];
      const decenas = 255 - pixel[1];
      const unidades = 255 - pixel[2];
      const decimales = 255 - pixel[3];

      const tempString = centenas.toString() + decenas.toString() + unidades.toString() + '.' + decimales.toString();

      return parseFloat(tempString);
    }
  }

  transformPixels_(image) {
    let canvas = document.createElement('canvas');
    canvas = this.drawImage_(image, canvas);
    let context = canvas.getContext('2d');

    if (canvas.width == 0) {
      return image;
    }

    const inputData = context.getImageData(0, 0, canvas.width, canvas.height);

    var output = context.createImageData(canvas.width, canvas.height);

    // Iterate through every pixel
    for (let i = 0; i < inputData.data.length; i += 4) {
      let pixel = [inputData.data[i + 0], inputData.data[i + 1], inputData.data[i + 2], inputData.data[i + 3]];

      if (pixel.toString() == '0,0,0,255' || pixel.toString() == '255,255,255,255') {
        pixel[3] = 0;
      }

      if (pixel[3] == 0) {
        continue;
      }

      const rgb = this.temp2palette_(this.rgb2temp_(pixel));
      if (rgb != null) {
        pixel[0] = rgb[0];
        pixel[1] = rgb[1];
        pixel[2] = rgb[2];
      }

      // Modify pixel data
      output.data[i + 0] = pixel[0]; // R value
      output.data[i + 1] = pixel[1]; // G value
      output.data[i + 2] = pixel[2]; // B value
      output.data[i + 3] = pixel[3]; // A value
    }
    context.putImageData(output, 0, 0);
    return canvas;
  }

  /**
   * Tracks successful image load.
   *
   * @private
   */
  handleImageLoad_() {
    const image = /** @type {HTMLImageElement} */ (this.image_);
    if (image.naturalWidth && image.naturalHeight) {
      this.state = TileState.LOADED;
    } else {
      this.state = TileState.EMPTY;
    }
    this.unlistenImage_();
    this.changed();
  }

  /**
   * Load not yet loaded URI.
   * @api
   */
  load() {
    if (this.state == TileState.ERROR) {
      this.state = TileState.IDLE;
      this.image_ = new Image();
      if (this.crossOrigin_ !== null) {
        this.image_.crossOrigin = this.crossOrigin_;
      }
    }
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      this.changed();
      this.tileLoadFunction_(this, this.src_);
      this.unlisten_ = listenImage(this.image_, this.handleImageLoad_.bind(this), this.handleImageError_.bind(this));
    }
  }

  /**
   * Discards event handlers which listen for load completion or errors.
   *
   * @private
   */
  unlistenImage_() {
    if (this.unlisten_) {
      this.unlisten_();
      this.unlisten_ = null;
    }
  }
}

/**
 * Get a 1-pixel blank image.
 * @return {HTMLCanvasElement} Blank image.
 */
function getBlankImage() {
  const ctx = createCanvasContext2D(1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas;
}

export default ImageTileCubiertasMod;
