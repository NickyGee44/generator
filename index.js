const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const {
  width,
  height,
  description,
  baseImageUri,
  editionSize,
  startEditionFrom,
  endEditionAt,
  factions,
  factionsWeight,
} = require("./input/config.js");
const console = require("console");
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var dnaList = [];

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `./output/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const signImage = (_sig) => {
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30pt Verdana";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(_sig, 40, 40);
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, 85%)`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  ctx.fillRect(0, 0, width, height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    dna: _dna.join(""),
    name: `#${_edition}`,
    description: description,
    image: `${baseImageUri}/${_edition}.png`,
    edition: _edition,
    date: dateTime,
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_element) => {
  ctx.drawImage(
    _element.loadedImage,
    _element.layer.position.x,
    _element.layer.position.y,
    _element.layer.size.width,
    _element.layer.size.height
  );
  addAttributes(_element);
};

const constructLayerToDna = (_dna = [], _factions = [], _faction) => {
  let mappedDnaToLayers = _factions[_faction].layers.map((layer, index) => {
    let selectedElement = layer.elements.find((e) => e.id == _dna[index]);
    return {
      name: layer.name,
      position: layer.position,
      size: layer.size,
      selectedElement: selectedElement,
    };
  });

  return mappedDnaToLayers;
};

const getFaction = (_editionCount) => {
  let faction = "No faction";
  factionsWeight.forEach((factionweight) => {
    if (_editionCount >= factionweight.from && _editionCount <= factionweight.to) {
      faction = factionweight.value;
    }
  });
  return faction;
};

const isDnaUnique = (_DnaList = [], _dna = []) => {
  let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
  return foundDna == undefined ? true : false;
};

const createDna = (_factions, _faction) => {
  let randNum = [];
  _factions[_faction].layers.forEach((layer) => {
    let randElementNum = Math.floor(Math.random() * 100) + 1;
    let num = 0;
    layer.elements.forEach((element) => {
      if (randElementNum >= 100 - element.weight) {
        num = element.id;
      }
    });
    randNum.push(num);
  });
  return randNum;
};

const writeMetaData = (_data) => {
  fs.writeFileSync("./output/_metadata.json", _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  fs.writeFileSync(
    `./output/${_editionCount}.json`,
    JSON.stringify(metadataList.find((meta) => meta.edition == _editionCount))
  );
};

const startCreating = async () => {
  writeMetaData("");
  let editionCount = startEditionFrom;
  while (editionCount <= endEditionAt) {
    let faction = getFaction(editionCount);
    let newDna = createDna(factions, faction);

    if (isDnaUnique(dnaList, newDna)) {
      let results = constructLayerToDna(newDna, factions, faction);
      let loadedElements = []; //promise array
      results.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((elementArray) => {
        ctx.clearRect(0, 0, width, height);
        // drawBackground();
        elementArray.forEach((element) => {
          drawElement(element);
        });
        signImage(`#${editionCount}`);
        saveImage(editionCount);
        addMetadata(newDna, editionCount);
        saveMetaDataSingleFile(editionCount);
        console.log(
          `Created edition: ${editionCount}, faction: ${faction} with DNA: ${newDna}`
        );
      });
      dnaList.push(newDna);
      editionCount++;
    } else {
      console.log("DNA exists!");
    }
  }
  writeMetaData(JSON.stringify(metadataList));
};

startCreating();
