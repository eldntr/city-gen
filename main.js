import * as storymap from "./index";

storymap.global.config = {
    debug: false,
    data: "./sample/Eiffel Area.geojson",
    path: "./sample/path.json",
    container: "container", // This should match the id of the canvas element
    citycenter: [2.295455689752966, 48.85530405243387],
    spawn: {
        buildings: true,
        ground: true,
        roads: true,
        water: true,
        green: true,  
    },
    color_background: 0x7C8892, //62717F
    color_buildings: 0xDADCDF,
    color_ground: 0x7C8892,
    color_roads: 0xffffff,
    color_water: 0x42a5f5,
    color_green: 0x658251,
    grid: { primary: 0x555555, secondary: 0x333333 },
    opacity_ground: 0.25,
};

storymap.start();