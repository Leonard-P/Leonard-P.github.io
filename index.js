function crop(url, aspectRatio) {
    // we return a Promise that gets resolved with our canvas element
    return new Promise((resolve) => {
      // this image will hold our source image data
      const inputImage = new Image();
  
      // we want to wait for our image to load
      inputImage.onload = () => {
        // let's store the width and height of our image
        const inputWidth = inputImage.naturalWidth;
        const inputHeight = inputImage.naturalHeight;
  
        // get the aspect ratio of the input image
        const inputImageAspectRatio = inputWidth / inputHeight;
  
        // if it's bigger than our target aspect ratio
        let outputWidth = inputWidth;
        let outputHeight = inputHeight;
        if (inputImageAspectRatio > aspectRatio) {
          outputWidth = inputHeight * aspectRatio;
        } else if (inputImageAspectRatio < aspectRatio) {
          outputHeight = inputWidth / aspectRatio;
        }
  
        // calculate the position to draw the image at
        const outputX = (outputWidth - inputWidth) * 0.5;
        const outputY = (outputHeight - inputHeight) * 0.5;
  
        // create a canvas that will present the output image
        const outputImage = document.createElement("canvas");
  
        // set it to the same size as the image
        outputImage.width = outputWidth;
        outputImage.height = outputHeight;
  
        // draw our image at position 0, 0 on the canvas
        const ctx = outputImage.getContext("2d");
        ctx.drawImage(inputImage, outputX, outputY);
        resolve(outputImage);
      };
      inputImage.src = url;
    });
}
                                                                      

class FixedDropout extends tf.layers.Layer {
    constructor() {
      super({});
    }

    call(input) {
      return tf.tidy(() => {
        if (Array.isArray(input)) {
          input = input[0];
          console.log('array conversion')
        }
        return input;
      });
    }

    static get className() {
      return 'FixedDropout';
    }
  }
  tf.serialization.registerClass(FixedDropout);

/*  class Lambda extends tf.layers.Layer {
    constructor() {
      super({});
    }

    call(input) {
      return tf.tidy(() => {
        if (Array.isArray(input)) {
          input = input[0];
          console.log('array conversion')
        }
        console.log(tf.mul(input, tf.fill([1, 128], 1000)));
        return tf.mul(input, tf.fill([1, 128], 1000));
      });
    }

    static get className() {
      return 'Lambda';
    }
  }
  tf.serialization.registerClass(Lambda);*/

/**
 Keine Ahnung, ob das Preprocessing korrekt funktioniert. Hab versucht, die preprocess_input so genau wie möglich nach JS zu übersetzen.
 Ein paar Tests ergeben etwas andere Werte, ähnlich nur bei 1:1-Bildern. Die letzten Werte stimmen überein, die ersten irgendwie nicht.
 */
function preprocessInput(img)
{
    img = tf.browser.fromPixels(img);
    img = tf.image.resizeBilinear(img, [224, 224]).toFloat();
    img = img.div(tf.scalar(255.0));
    mean = [0.485, 0.456, 0.406];
    std = [0.229, 0.224, 0.225];

    let indices = [
        tf.tensor1d([0], "int32"),
        tf.tensor1d([1], "int32"),
        tf.tensor1d([2], "int32")
    ];

    let centeredRGB = {
        red: tf.gather(img, indices[0], 2).sub(tf.scalar(mean[0])).div(tf.scalar(std[0])).reshape([224*224]),
        green: tf.gather(img, indices[1], 2).sub(tf.scalar(mean[1])).div(tf.scalar(std[1])).reshape([224*224]),
        blue: tf.gather(img, indices[2], 2).sub(tf.scalar(mean[2])).div(tf.scalar(std[2])).reshape([224*224]),
    };

    let processedTensor = tf.stack([
        centeredRGB.red, centeredRGB.green, centeredRGB.blue
    ], 1, "float32").reshape([224, 224, 3]).expandDims();
    processedTensor.print();
    return processedTensor;
}

jQuery(document).ready(function($) {
  tf.loadLayersModel("base/model.json").then(function(model){
    var pred = model.predict(preprocessInput($("#img").get(0)), "float32");
    pred.data().then((pred) => {
      pred = tf.tensor(pred);
      pred.print();
      //pred = pred.div(tf.scalar(Math.pow(10, 12)));
      //pred = K.sigmoid(pred);
      //pred.print();
    })
  })   
});



