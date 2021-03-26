tf.loadLayersModel("base/model.json").then(createVectors);

function preprocessInput(img) {
  let imageSize = 350;

  img = tf.browser.fromPixels(img);
  img = tf.image.resizeBilinear(img, [imageSize, imageSize]).toFloat();
  img = img.div(tf.scalar(255.0));
  mean = [0.485, 0.456, 0.406];
  std = [0.229, 0.224, 0.225];

  let indices = [
    tf.tensor1d([0], "int32"),
    tf.tensor1d([1], "int32"),
    tf.tensor1d([2], "int32"),
  ];

  let processedValues = {
    red: tf
      .gather(img, indices[0], 2)
      .sub(tf.scalar(mean[0]))
      .div(tf.scalar(std[0]))
      .reshape([imageSize * imageSize]),
    green: tf
      .gather(img, indices[1], 2)
      .sub(tf.scalar(mean[1]))
      .div(tf.scalar(std[1]))
      .reshape([imageSize * imageSize]),
    blue: tf
      .gather(img, indices[2], 2)
      .sub(tf.scalar(mean[2]))
      .div(tf.scalar(std[2]))
      .reshape([imageSize * imageSize]),
  };

  let processedTensor = tf
    .stack(
      [processedValues.red, processedValues.green, processedValues.blue],
      1,
      "float32"
    )
    .reshape([imageSize, imageSize, 3])
    .expandDims();
  return processedTensor;
}

loadImage = async (img) => {
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      resolve(true);
    };
  });
};

async function createVectors(model) {
  var vectors = "var vecs = [";
  for (let i = 0; i <= 2000; i++) {
    let img = new Image();
    img.src = "/data/" + i.toString() + ".jpg";
    await loadImage(img);
    let imgPreprocessed = preprocessInput(img);
    let vector = model.predict(imgPreprocessed).dataSync();
    var vectorR = [];
    for (let x = 0; x < vector.length; x++) {
      vectorR.push(Math.round(vector[x] * 100000) / 100000);
    }
    console.log(i.toString() + "/2000");
    vectors += "[" + vectorR.toString() + "],";
  }
  vectors += "];";
  download(vectors, "vectors.js", "text/plain");
}

function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
