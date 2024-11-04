import { GLOBAL as $ } from "./globals";
import * as THREE from "three";
import * as GEOLIB from "geolib";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
// import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

async function loadGeoJsonAsync() {
	return await fetch($.config.data).then((response) => {
		return response.json().then((data) => {
			return data.features;
		});
	});
}

function convertPointToPolygon(point, radius = 0.0001) {
    const [lon, lat] = point;

    // Membuat segi lima kecil di sekitar `Point` untuk merepresentasikan area yang kecil
    return [
        [
            [lon - radius, lat - radius],
            [lon + radius, lat - radius],
            [lon + radius, lat + radius],
            [lon - radius, lat + radius],
            [lon - radius, lat - radius]
        ]
    ];
}


function create3dObjects(data) {
    let geometryType = data.geometry.type;
    let coordinates = data.geometry.coordinates;
    let properties = data.properties;

    if (properties.building && (geometryType === "Polygon" || geometryType === "MultiPolygon")) {
        let building_levels = properties["building:levels"] || 1;
        let buildingGeometry = generateBuilding(coordinates, building_levels);
        if (buildingGeometry) {
            $.buildingArray.push(buildingGeometry);
        }

    } else if (properties.highway && geometryType === "LineString") {
        let road = generateRoad(coordinates, properties);
        if (road) {
            $.roadArray.push(road);
        }

    } else if (properties.natural && (geometryType === "Polygon" || geometryType === "MultiPolygon")) {
        let waterGeometry = generateWater(coordinates, properties);
        if (waterGeometry) {
            $.waterArray.push(waterGeometry);
        }

    } else if (properties.leisure && (geometryType === "Polygon" || geometryType === "MultiPolygon")) {
        let greenGeometry = generateGreen(coordinates);
        if (greenGeometry) {
            $.greenArray.push(greenGeometry);
        }

    } else if (geometryType === "Point") {
        const pointPolygon = convertPointToPolygon(coordinates);
        if (properties.natural) {
            let waterGeometry = generateWater(pointPolygon, properties);
            if (waterGeometry) {
                $.waterArray.push(waterGeometry);
            }
        } else if (properties.leisure) {
            let greenGeometry = generateGreen(pointPolygon);
            if (greenGeometry) {
                $.greenArray.push(greenGeometry);
            }
        }

    } else {
        console.warn("Skipping unsupported geometry type or invalid coordinates structure:", geometryType, coordinates);
    }
}

function generateBuilding(coordinates, height = 1) {
    let buildingShape, buildingGeometry;

    // Jika koordinat adalah MultiPolygon, ambil bagian pertama
    if (Array.isArray(coordinates[0][0][0])) {
        coordinates = coordinates[0];
    }

    // Pastikan koordinat valid
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid building coordinates:", coordinates);
        return undefined;
    }

    coordinates.forEach((points, index) => {
        // Setiap `points` harus memiliki setidaknya 3 titik agar dapat membentuk area
        if (!Array.isArray(points) || points.length < 3) {
            console.warn("Invalid polygon structure, must have at least 3 points:", points);
            return; // Skip this iteration if points are invalid
        }

        if (index === 0) {
            buildingShape = generateShape(points);
            if (!buildingShape) {
                console.warn("Failed to generate main building shape:", points);
            }
        } else {
            if (buildingShape) {
                const holeShape = generateShape(points);
                if (holeShape) {
                    buildingShape.holes.push(holeShape);
                } else {
                    console.warn("Failed to generate hole for building:", points);
                }
            }
        }
    });

    if (!buildingShape) {
        console.warn("Failed to generate valid building shape for coordinates:", coordinates);
        return undefined;
    }

    buildingGeometry = generateGeometry(buildingShape, height);
    return buildingGeometry;
}


function generateRoad(coordinates, properties, height = 0) {
	// console.log(1);
	let points = [];

	//check if multi-point road, not a point.
	if (coordinates.length > 1) {
		coordinates.forEach((coordinates) => {
			let coords = normalizeCoordinates(coordinates, $.config.citycenter);
			// points.push(new THREE.Vector3(coords[0], height, coords[1])); //old way
			points.push(coords[0], height, coords[1]);
		});

		// NEW WAY
		let geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(points, 3),
		);

		//OLD WAY
		// let geometry = new THREE.BufferGeometry().setFromPoints(points);
		geometry.rotateZ(Math.PI);
		return geometry;
	} else {
		return undefined;
	}
}

function generateWater(coordinates, properties, height = 0.007) {
    let waterShape, waterGeometry;

    if (Array.isArray(coordinates[0][0][0])) {
        coordinates = coordinates[0];
    }

    // Pastikan koordinat valid sebelum melanjutkan
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid water coordinates:", coordinates);
        return undefined;
    }

    coordinates.forEach((points, index) => {
        if (index === 0) {
            waterShape = generateShape(points);
        } else {
            if (waterShape) {
                waterShape.holes.push(generateShape(points));
            } else {
                console.warn("Unable to create main water shape:", points);
            }
        }
    });

    if (!waterShape) {
        console.warn("Failed to generate water shape for coordinates:", coordinates);
        return undefined;
    }

    try {
        waterGeometry = generateGeometry(waterShape, height);
    } catch (error) {
        console.error("Error generating water geometry:", error);
        return undefined;
    }
    
    return waterGeometry;
}

function generateGreen(coordinates, height = 0) {
    let greenShape, greenGeometry;

    if (Array.isArray(coordinates[0][0][0])) {
        coordinates = coordinates[0];
    }

    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid green coordinates:", coordinates);
        return undefined;
    }

    coordinates.forEach((points, index) => {
        if (index === 0) {
            greenShape = generateShape(points);
        } else {
            if (greenShape) {
                greenShape.holes.push(generateShape(points));
            } else {
                console.warn("Unable to create main green shape:", points);
            }
        }
    });

    if (!greenShape) {
        console.warn("Failed to generate green shape for coordinates:", coordinates);
        return undefined;
    }

    try {
        greenGeometry = generateGeometry(greenShape, height);
    } catch (error) {
        console.error("Error generating green geometry:", error);
        return undefined;
    }
    
    return greenGeometry;
}

function generateShape(polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
        console.warn("Invalid polygon structure, must have at least 3 points:", polygon);
        return undefined;
    }

    let shape = new THREE.Shape();

    try {
        polygon.forEach((coordinates, index) => {
            let coords = normalizeCoordinates(coordinates, $.config.citycenter);
            if (index === 0) {
                shape.moveTo(coords[0], coords[1]);
            } else {
                shape.lineTo(coords[0], coords[1]);
            }
        });

        if (shape.curves.length === 0) {
            console.warn("Failed to generate valid shape, no valid curves created:", polygon);
            return undefined;
        }

    } catch (error) {
        console.error("Error generating shape:", error);
        return undefined;
    }

    return shape;
}


function generateGeometry(shape, height) {
	// let height = 1;
	let geometry = new THREE.ExtrudeBufferGeometry(shape, {
		curveSegments: 1,
		depth: 0.05 * height,
		bevelEnabled: false,
	});

	geometry.rotateX(Math.PI / 2);
	geometry.rotateZ(Math.PI);
	return geometry;
	// // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	// const material = new THREE.MeshPhongMaterial({
	// 	color: $.config.color_buildings,
	// });
	// const mesh = new THREE.Mesh(geometry, material);

	// mesh.updateMatrix();
	// // buildingGeometry.merge(mesh);

	// // console.log(mesh);
	// return mesh;
	// $.scene.add(mesh);
}

//SPAWN GENERATED OBJECTS
function spawnBuildings() {
	let mergedGeometry = mergeBufferGeometries($.buildingArray);

	const material = new THREE.MeshPhongMaterial({
		color: $.config.color_buildings,
	});
	const mesh = new THREE.Mesh(mergedGeometry, material);
	mesh.name = "BUILDINGS";
	mesh.updateMatrix();
	// buildingGeometry.merge(mesh);
	mesh.layers.set(0);
	mesh.frustumCulled = false;
	// console.log(mesh);
	mesh.castShadow = true;
	$.scene.add(mesh);
}

function spawnRoads() {
	$.roadArray.forEach((road, index) => {
		let line = new THREE.Line(road, $.material_road);
		line.name = "ROAD" + index;
		line.layers.set(1);
		line.frustumCulled = false;
		$.scene.add(line);
	});

	// for (let index = 0; index < 50; index++) {
	// 	console.log($.roadArray[index]);
	// }
}

function spawnWater() {
    const validGeometries = $.waterArray.filter((geometry) => geometry !== undefined);
    if (validGeometries.length > 0) {
        let mergedGeometry;
        try {
            mergedGeometry = mergeBufferGeometries(validGeometries);
        } catch (error) {
            console.error("Error merging water geometries:", error);
            return;
        }

        const mesh = new THREE.Mesh(mergedGeometry, $.material_water);
        mesh.name = "WATER";
        mesh.updateMatrix();
        mesh.position.y -= 0.01;
        mesh.layers.set(0);
        mesh.frustumCulled = false;
        $.scene.add(mesh);
    } else {
        console.warn("No valid water geometries to spawn.");
    }
}

function spawnGreen() {
    const validGeometries = $.greenArray.filter((geometry) => geometry !== undefined);
    if (validGeometries.length > 0) {
        let mergedGeometry;
        try {
            mergedGeometry = mergeBufferGeometries(validGeometries);
        } catch (error) {
            console.error("Error merging green geometries:", error);
            return;
        }

        const mesh = new THREE.Mesh(mergedGeometry, $.material_green);
        mesh.name = "GREEN";
        mesh.updateMatrix();
        mesh.position.y -= 0.01;
        mesh.layers.set(0);
        mesh.frustumCulled = false;
        $.scene.add(mesh);
    } else {
        console.warn("No valid green geometries to spawn.");
    }
}

function spawnGround() {
	const geometry = new THREE.PlaneGeometry(50, 50);
	const material = new THREE.MeshBasicMaterial({
		color: 0xfafafa,
		side: THREE.DoubleSide,
	});

	const plane = new THREE.Mesh(geometry, material);
	plane.receiveShadow = true;
	plane.rotation.x = Math.PI / 2;
	plane.position.y -= 0.03;
	// plane.position.y = 0;
	// plane.position.x = 0;
	$.scene.add(plane);
}

function normalizeCoordinates(objectPosition, centerPosition) {
    // Get GPS distance (in meters)
    let dis = GEOLIB.getDistance(objectPosition, centerPosition);

    // Get bearing angle
    let bearing = GEOLIB.getRhumbLineBearing(objectPosition, centerPosition);

    // Calculate X by centerPosi.x + distance * cos(rad)
    let x = dis * Math.cos((bearing * Math.PI) / 180);

    // Calculate Y by centerPosi.y + distance * sin(rad)
    let y = dis * Math.sin((bearing * Math.PI) / 180);

    // Reverse X to adjust the map projection direction (depending on your coordinate system)
    return [-x / 1000, y / 1000]; // Scaling down to fit in the `three.js` scene (adjust scale as needed)
}

//main function
async function generateCity(
	config = { buildings: true, roads: true, water: true, green: true },
) {
	// LOAD GEOJSON DATA
	let data = await loadGeoJsonAsync();
	// console.log(data);

	//generate shapes, meshes and lines
	data.forEach((element) => {
		create3dObjects(element, config);
	});

	spawnBuildings();
	spawnRoads();
	spawnWater();
	spawnGreen();
	spawnGround();
	// if (config.buildings) {
	// 	spawnBuildings();
	// }
	// if (config.roads) {
	// 	spawnRoads();
	// }
	// if (config.water) {
	// 	spawnWater();
	// }
	// if (config.green) {
	// 	spawnGreen();
	// }
}

export { generateCity };