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
    return processedTensor;
}

// Quelle: https://stackoverflow.com/questions/11301438/return-index-of-greatest-value-in-an-array
function indexOfMin(arr) {
  if (arr.length === 0) {
      return -1;
  }

  var indices = [1, 2, 3, 4, 5];

  var min = arr[0];
  var minIndex = 0;

  for (var i = 1; i < arr.length; i++) {
      if (arr[i] < min) {
          minIndex = i;
          min = arr[i];
      }
  }

  return minIndex;
}


//Quelle: https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
function sortWithIndices(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function(left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  toSort.sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    toSort.sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return toSort;
}


async function euclidean(x, y) {
  let distance = await tf.squaredDifference(x, y).sum(axis=1).sqrt().array();
  return distance;
}

jQuery(document).ready(function($){
  tf.loadLayersModel("base/model.json").then(getSimilar);
});

async function getSimilar(model){
  var pred = model.predict(preprocessInput($("#img").get(0)), "float32");
  pred = tf.tensor(pred.dataSync());
  t0 = performance.now();
  let distances = await euclidean(tf.stack(vectors), pred.reshape([1, 128]));
  console.log(performance.now()-t0);
  pred.print();
  //console.log(distances);
  t0 = performance.now();
  console.log(sortWithIndices(distances));
  console.log(performance.now()-t0);
}



