// This contains the code for generating a random plant badge.
// I wrote it with limited internet access, meaning that it looks like Python and uses no clever Javascript tricks.
// You've been warned!

// Javascript can't access images by path.
// This workaround is hideous, but what can ya do :) (while hosting to github and not using ajax, I mean)
all_foliage = ["https://i.imgur.com/PabdLnL.png", "https://i.imgur.com/WN2m2Aa.png", "https://i.imgur.com/wsC3ifp.png",
               "https://i.imgur.com/NFM09J5.png", "https://i.imgur.com/urBlTiV.png", "https://i.imgur.com/kyfs2Yl.png",
               "https://i.imgur.com/nMW2bBb.png", "https://i.imgur.com/tBQb6yy.png", "https://i.imgur.com/5j6u58a.png",
               "https://i.imgur.com/Mb1wqi1.png", "https://i.imgur.com/Rk7vvo3.png", "https://i.imgur.com/DdEYVYA.png",
               "https://i.imgur.com/IF5MQWY.png", "https://i.imgur.com/Z6njdmV.png", "https://i.imgur.com/cDAqt4U.png",
               "https://i.imgur.com/117aiCY.png", "https://i.imgur.com/7ZrX05Y.png", "https://i.imgur.com/ZMe5J0j.png",
               "https://i.imgur.com/wLsuJSX.png", "https://i.imgur.com/dxJbfgi.png", "https://i.imgur.com/l1MK3yJ.png",
               "https://i.imgur.com/kTbrzeL.png", "https://i.imgur.com/s4Uav2q.png", "https://i.imgur.com/6GPgZzr.png",
               "https://i.imgur.com/E6ikrq8.png", "https://i.imgur.com/krfsneI.png", "https://i.imgur.com/4hhVL8W.png",
               "https://i.imgur.com/vtf2YZj.png"];
// Done this way because of the silly imgur link workaround--we need to be able to preserve the numbering so we can figure
// out which plant is which
common_foliage = [all_foliage[0]]  // (expand this later)
// for testing
foliage = all_foliage;

// Rarity level:
// 1: only common things available
// 2: adds uncommon foliage
// 3?: adds complex flowers, use common ones instead at lower rarities??
// 3/4: adds uncommon foliage colors
// 4?: adds chance of doubles? triples need to die
// 4/6: adds rare foliage
// 5/7: adds rare foliage colors
// 8: add rare flower colors
// 9: increased weight of uncommon + rare colors?
// 10: increased weight of rare colors?

// bingo difficulty could be difficulty*size_rating+1. so an easy*small is (1*1+1=2), easy*medium is (1*2+1), hard*big is (3*3+1=10), pain*medium is (2*4+1=9)
// maybe you sometimes get a free max(1,difficulty-2) plant as a bonus so that that level 1 is somewhat relevant. or something.


var basic_flowers = ["https://i.imgur.com/G4h84Ht.png", "https://i.imgur.com/vXQYMkL.png"];
var complex_flowers = ["https://i.imgur.com/p1ipMdS.png", "https://i.imgur.com/UUFJO7h.png"];

var base_foliage_palette = ["#aed740", "#76c935", "#50aa37", "#2f902b"];
var base_foliage_light = base_foliage_palette[1];  // second from lightest
var base_flower_palette = ["f3addd", "d87fbc", "c059a0", "aa3384"];
var base_accent_palette = ["fff4cc", "ffe47b", "ffd430", "ecb600"];

var work_canvas_size = 32;  // in pixels

// Roll more than two_foliage_roll out of 1 to have two pieces of base foliage, etc.
var two_foliage_roll = 0.95;
var three_foliage_roll = 0.99;

var place_complex_flower = "#ff943a";
var place_simple_flower = "#e900ff";

var common_foliage_palettes = [["#aed740", "#76c935", "#50aa37", "#2f902b"], ["a2ac4d", "8f974a", "66732a", "4b692f"],
                               ["7ad8b7","5eb995", "3e946d", "277b50"], ["9dbb86", "679465", "476f58", "2f4d47"],
                               ["8fbe99", "7faf89", "58906f", "2f4d47"], ["fdff07", "b9d50f", "669914", "34670b"]];
var uncommon_foliage_palettes = [["e7d7c1", "a78a7f", "735751", "704542"], ["fdff07", "d3a740", "b2773a", "934634"]];
var rare_foliage_palettes = [["f1ccc2", "e5b7b7", "d396a8", "c9829d"], ["9c6695", "734978", "4c2d5c", "2f1847"],
                             ["d1d2f9", "a3bcf9", "7796cb", "576490"]]; 

//, ["468816", "4b692f"], ["207316", "0d4f2e"], ["ad6f30", "942020"], ["23943a", "0a713d"],
//["807f58","626a4f"],["40423a","31332e"],["1a9410","037c16"],["6da576","548a5c"],["d48dc7","bf709d"],["38b463","249049"],
//["82541e","6a3a17"],["634534","533b2e"],

// For testing
var foliage_palettes = common_foliage_palettes.concat(uncommon_foliage_palettes).concat(rare_foliage_palettes);

var flower_palettes = [["f3addd", "d87fbc", "c059a0", "aa3384"],["f1ccc2", "e5b7b7", "d396a8", "c9829d"],
                       ["9c6695", "734978", "4c2d5c", "2f1847"],["d1d2f9", "a3bcf9", "7796cb", "576490"],
                       ["e7d7c1", "a78a7f", "735751", "704542"], ["fdff07", "d3a740", "b2773a", "934634"]];
//["d77bba", "bd4b99"], ["d77bba", "bd4b99"], ["fbf236", "efce35"], ["7835ef", "5a23e6"], ["fefeee", "f2f2d6"],
//                       ["6da576","548a5c"], ["ce1e37", "b10c23"], ["7dcfd6", "5bbc98"], ["e3d572", "cab851"]];


async function place_image_at_coords_with_chance(img_url, list_of_coords, ctx, chance, anchor_to_bottom=false){
    // In canvas context ctx, place image at img_path "centered" at each (x,y) in list_of_coords with chance odds (ex 0.66 for 66%)
    // 50% chance to horizontally mirror each one (TODO)
    // Wondering if the shared ctx save/reload and use of async-await is giving me the "floating flowers" issue in here.
    // I may revisit (creating a canvas just for the image and flipping it there), but it feels like overkill for now.
    var img = new Image();
    img.src = img_url;
    img.crossOrigin = "anonymous"
    // closure to load an image because yes
    img.onload = (function(list_of_coords) {
      return function() {
      var w_offset = Math.floor(img.width/2);
      if(!anchor_to_bottom){
        var h_offset = Math.floor(img.height/2)-1;
      } else {
        var h_offset = -img.height + 1;
      }
      for (var i=0;i<list_of_coords.length;i++) {
        if (Math.random() < chance){
          [x,y] = list_of_coords[i];
          ctx.drawImage(img, x-w_offset, y+h_offset);
        }
      }
    }})(list_of_coords);
    await img.decode();
    return img;
}

function preload_plants()
// TODO: Gross prototype nonsense.
{
  refs = []
  lists_to_load = [foliage, basic_flowers, complex_flowers]
  for(var i=0; i<lists_to_load.length; i++){
      for(var j=0; j<lists_to_load[i].length;j++){
        var img=new Image();
        img.src=lists_to_load[i][j];
        img.crossOrigin = "anonymous"
        refs.push(img);
      }
  }
  // to keep in memory
  return refs
}


async function gen_plant() {
    // Returns the image data for a generated plant
    var work_canvas = document.createElement("canvas");
    var work_ctx=work_canvas.getContext("2d");
    work_canvas.width = work_canvas_size;
    work_canvas.height = work_canvas_size;
    // How much base foliage to combine
    var foliage_amount;
    const foliage_roll = Math.random();
    if(foliage_roll < two_foliage_roll){
        foliage_amount = 1;
    } else if(foliage_roll < three_foliage_roll){
        foliage_amount = 2;
    } else {
        foliage_amount = 3;
    }
    // https://stackoverflow.com/questions/19269545/how-to-get-a-number-of-random-elements-from-an-array
    // TODO look up =>...probably not a cursed GTE :)
    var imgs = foliage.sort(() => .5 - Math.random()).slice(0,foliage_amount);
    var do_flip = false;
    for(var i=0;i<imgs.length;i++){
      if(Math.random() < 0.5){
        do_flip=true;
        work_ctx.save();
        //work_ctx.translate(work_canvas_size, 0);
        //work_ctx.scale(-1, 1);
      } else {do_flip=false};
      await place_image_at_coords_with_chance(imgs[i], [[Math.floor(work_canvas_size/2)-1, work_canvas_size-1]], work_ctx, 1, true);
    if(do_flip){work_ctx.restore();}
    }

    // Figure out where to put each kind of flower, replacing marker pixels as we go
    simple_flower_coords = get_flower_coords(place_simple_flower, work_ctx);
    complex_flower_coords = get_flower_coords(place_complex_flower, work_ctx);

    // Recolor the foliage
    var new_foliage_palette = foliage_palettes[Math.floor(Math.random()*foliage_palettes.length)];
    replace_color_palette(base_foliage_palette, new_foliage_palette, work_ctx);

    // Place the flowers
    var flower_url;
    if(simple_flower_coords.length > 0){
        flower_url = basic_flowers[Math.floor(Math.random()*basic_flowers.length)];
        await place_image_at_coords_with_chance(flower_url, simple_flower_coords, work_ctx, 0.5);
    }
    if(complex_flower_coords.length > 0){
        // Chance that if there's already simple flowers, we keep using that flower
        if(simple_flower_coords.length == 0 || Math.random()>0.5){
            flower_url = complex_flowers[Math.floor(Math.random()*complex_flowers.length)];
        }
        await place_image_at_coords_with_chance(flower_url, complex_flower_coords, work_ctx, 0.8, true);
    }

    // Recolor the flowers and accent
    var new_flower_palette = flower_palettes[Math.floor(Math.random()*flower_palettes.length)];
    replace_color_palette(base_flower_palette, new_flower_palette, work_ctx);
    var new_accent_palette = flower_palettes[Math.floor(Math.random()*flower_palettes.length)];
    replace_color_palette(base_accent_palette, new_accent_palette, work_ctx);

    // We can draw a canvas directly on another canvas
    return work_canvas;
}

function hexToRgb(hex) {
  // taken from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}


function replace_color(old_rgb, new_rgb, ctx) {
    // `old_rgb` and `new_rgb`: (r, g, b)
    // taken from https://stackoverflow.com/questions/16228048/replace-a-specific-color-by-another-in-an-image-sprite
    var imageData = ctx.getImageData(0, 0, work_canvas_size, work_canvas_size);
    var oldRed, oldGreen, oldBlue;
    var newRed, newGreen, newBlue;
    [oldRed, oldGreen, oldBlue] = old_rgb;
    [newRed, newGreen, newBlue] = new_rgb;
    for (var i=0;i<imageData.data.length;i+=4)
      {
          // is this pixel the old rgb?
          if(imageData.data[i]==oldRed &&
             imageData.data[i+1]==oldGreen &&
             imageData.data[i+2]==oldBlue
          ){
              // change to your new rgb
              imageData.data[i]=newRed;
              imageData.data[i+1]=newGreen;
              imageData.data[i+2]=newBlue;
          }
      }
    // put the data back on the canvas  
    ctx.putImageData(imageData,0,0);
}

// Palettes MUST be the same length, FYI
function replace_color_palette(old_palette, new_palette, ctx) {
    var oldRGB, newRGB;
    // We do some truly hideous hacks because I'm bad at Javascript :)
    // Basically, we use the r, g, and b as a 3-level key into an object
    // If we follow it to the bottom and something exists, it's something we replace
    var paletteSwap = {};
    for(var i=0; i<old_palette.length; i++){
        oldRGB = hexToRgb(old_palette[i]);
        paletteSwap[oldRGB[0]] = {};
        paletteSwap[oldRGB[0]][oldRGB[1]] = {};
        paletteSwap[oldRGB[0]][oldRGB[1]][oldRGB[2]] = hexToRgb(new_palette[i]);
    }
    // taken from https://stackoverflow.com/questions/16228048/replace-a-specific-color-by-another-in-an-image-sprite
    var imageData = ctx.getImageData(0, 0, work_canvas_size, work_canvas_size);
    for (var i=0;i<imageData.data.length;i+=4)
      {
          // god this is painful to look at. I'm sorry.
          if(paletteSwap[imageData.data[i]] != undefined &&
             paletteSwap[imageData.data[i]][imageData.data[i+1]] != undefined &&
             paletteSwap[imageData.data[i]][imageData.data[i+1]][imageData.data[i+2]] != undefined){
              newRGB = paletteSwap[imageData.data[i]][imageData.data[i+1]][imageData.data[i+2]];
              imageData.data[i]=newRGB[0];
              imageData.data[i+1]=newRGB[1];
              imageData.data[i+2]=newRGB[2];
          }
      }
    // put the data back on the canvas  
    ctx.putImageData(imageData,0,0);
}

function get_flower_coords(flower_hex, ctx) {
    // Go through an image and find where to place the flowers. Very similar to replace_color().
    // NOTE: replaces flower_rgb pixels with base_foliage_light ones! This is because we don't always
    // place flowers and don't want a pixel escaping.
    var ret_coords = [];
    var imageData = ctx.getImageData(0, 0, work_canvas_size, work_canvas_size);
    [oldRed, oldGreen, oldBlue] = hexToRgb(flower_hex);
    [newRed, newGreen, newBlue] = hexToRgb(base_foliage_light);
    var pixel = 0;
    for (var i=0;i<imageData.data.length;i+=4)
      {
          // is this pixel the old rgb?
          if(imageData.data[i]==oldRed &&
             imageData.data[i+1]==oldGreen &&
             imageData.data[i+2]==oldBlue
          ){
              // change to your new rgb
              imageData.data[i]=newRed;
              imageData.data[i+1]=newGreen;
              imageData.data[i+2]=newBlue;
              // Ready to get a little cursed? Because there's probably a better way to do this, but it's a dumb project so...
              pixel = i/4;
              ret_coords.push([pixel%work_canvas_size, Math.floor(pixel/work_canvas_size)]);
          }
      }
    ctx.putImageData(imageData,0,0);
    return ret_coords
  }
