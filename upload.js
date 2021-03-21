function crop(url, aspectRatio) {
  return new Promise((resolve) => {
    const inputImage = new Image();

    inputImage.onload = () => {
      const inputWidth = inputImage.naturalWidth;
      const inputHeight = inputImage.naturalHeight;
      const inputImageAspectRatio = inputWidth / inputHeight;
      let outputWidth = inputWidth;
      let outputHeight = inputHeight;

      if (inputImageAspectRatio > aspectRatio) {
        outputWidth = inputHeight * aspectRatio;
      } else if (inputImageAspectRatio < aspectRatio) {
        outputHeight = inputWidth / aspectRatio;
      }

      const outputX = (outputWidth - inputWidth) * 0.5;
      const outputY = (outputHeight - inputHeight) * 0.5;

      const outputImage = document.createElement("canvas");
      outputImage.width = outputWidth;
      outputImage.height = outputHeight;
      const ctx = outputImage.getContext("2d");
      ctx.drawImage(inputImage, outputX, outputY);
      resolve(outputImage);
    };
    inputImage.src = url;
  });
}

function preprocessInput(img) {
  img = tf.browser.fromPixels(img);
  img = tf.image.resizeBilinear(img, [350, 350]).toFloat();
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
      .reshape([350 * 350]),
    green: tf
      .gather(img, indices[1], 2)
      .sub(tf.scalar(mean[1]))
      .div(tf.scalar(std[1]))
      .reshape([350 * 350]),
    blue: tf
      .gather(img, indices[2], 2)
      .sub(tf.scalar(mean[2]))
      .div(tf.scalar(std[2]))
      .reshape([350 * 350]),
  };

  let processedTensor = tf
    .stack(
      [processedValues.red, processedValues.green, processedValues.blue],
      1,
      "float32"
    )
    .reshape([350, 350, 3])
    .expandDims();
  return processedTensor.arraySync();
}

async function readURL(input) {
  if (input.files && input.files[0]) {
    setTimeout(function (e) {
      var reader = new FileReader();
      reader.onload = function (e) {
        crop(e.target.result, 1).then((img) => {
          $("#upload-area").attr(
            "style",
            "background-image: url(" + img.toDataURL() + ")"
          );
          document.getElementById("upload-area").style.backgroundRepeat =
            "no-repeat";

          $("#upload-content").attr("style", "display: none");

          var preprocessedInput = new Image();
          preprocessedInput.src = img.toDataURL();
          var worker = new Worker("worker.js");
          preprocessedInput.onload = () => {
            img = preprocessInput(preprocessedInput);

            worker.postMessage(img);
          };

          worker.addEventListener("message", function (e) {
            var distances = e.data;
            var indices = distances.sortIndices;
            for (let i = 1; i <= 6; i++) {
              document.getElementById("platz-" + i.toString()).src =
                "data/" + indices[i - 1].toString() + ".jpg";
              document
                .getElementById("platz-" + i.toString())
                .parentElement.getElementsByClassName(
                  "card-text"
                )[1].textContent =
                "Vektorabstand: " + distances[i - 1].toFixed(3).toString();
            }
            $("#info-message").attr("style", "display: none");
          });

          //loadAndExecuteModel(img);
        });
      };

      reader.readAsDataURL(input.files[0]);
    }, 400);
    $("#info-message").attr("style", "display: block");
  }
}

function showInfo(input) {
  document.getElementById("infoModal").style.display = "block";
}
