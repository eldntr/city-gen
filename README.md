# Storymaps

This package generates a 3D city using geojson data from OpenStreetMaps, generated by overpass-turbo.
The package comes with a sample dataset of Bruges, however you will need to get your own data if you want another city.

Thesis I wrote about this project is available at: https://lavrenov.io/thesis/thesis.pdf

## DEMO

-   list of demos available at https://tania.tours/demo

## Getting GeoJSON data

Get the geojson data from [overpass-turbo](https://overpass-turbo.eu);

Select the area you want to display on the website, and copy and run the query below.
Click on Export and save as geojson.

```
[out:json]
[bbox:{{bbox}}]
[timeout:30];

(
way["building"]({{bbox}});
relation["building"]["type"="multipolygon"]({{bbox}});

way["highway"]({{bbox}});
relation["highway"]["type"="polygon"]({{bbox}});

way["natural"="water"]({{bbox}});
way["water"="lake"]({{bbox}});
way["natural"="coastline"]({{bbox}});
way["waterway"="riverbank"]({{bbox}});

way["leisure"="park"]({{bbox}});
way["leisure"="garden"]({{bbox}});
);

out;
>;
out qt;
```

You also need the latitude and longitude coordinates of the center of the selected area.
You can use Google Maps to get this data.

## Configuration

after installing this package following the steps in INSTALLATION.md, you can start configuring it in main.js
before you run the setup() or start() functions, create a configuration.

```js
import * as storymaps from "storymap";

storymaps.global.config = {
	debug: true,
	data: "/node_modules/storymap/sample/bruges.geojson",
	path: "/node_modules/storymap/sample/path.json",
	container: "container",
	citycenter: [3.227183, 51.209651],
	color_background: 0x222222,
	color_buildings: 0xfafafa,
	grid: { primary: 0x555555, secondary: 0x333333 },
	color_ground: 0x00ff00,
	opacity_ground: 0.25,
};

storymaps.setup();
```

This will overwrite the default configuration values.

-   data: points to the geojson data you can get from overpass.turbo.eu
-   path: points to a path you can create in .setup() mode.
-   container: the ID of the div in which your canvas will sit.
-   citycenter: the latitude/longitude of the centerpoint of your geojson data.

## ANIMATION

To exit "create a path mode", use the .start() function.

```js
// storymaps.setup()
storymaps.start();
```

This will create an on-scroll animation for the camera that follows the path you created on scroll.
