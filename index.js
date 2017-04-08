var express = require('express')
var app = express()
var bodyParser = require('body-parser');

//basic function to sort the array base on the keys of the object in the array
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function calculateAverage(array) {
    var sum = array.reduce(function (prev, next) {
        return prev + next
    })
    return sum/array.length
}

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res) {
    res.send("Hello!")
})

app.post('/', function (req, res) {
    var jsonInput = req.body
    var usedPlanes = []
    var planes = []
    var parameters = ["noise-level", "brake-distance", "vibrations"]
    var resultArray = []
    var result

    //add planes to the planes object and put all of their measurements together to one plane
    jsonInput.measurements.map(function (plane) {
        var indexOfPlane = usedPlanes.indexOf(plane.type)
        if (indexOfPlane === -1) {
            usedPlanes.push(plane.type)
            planes.push({
                "type": plane.type
            })
            parameters.map(function (parameter) {
                planes[planes.length-1][parameter] = [plane[parameter]]
            })
        } else {
            parameters.map(function (parameter) {
                planes[indexOfPlane][parameter].push(plane[parameter])
            })
        }
    })

    //calculate average value for every property of each plane
    planes.map(function (plane) {
        parameters.map(function (parameter) {
            plane[parameter] = calculateAverage(plane[parameter])
        })
    })

    //find a coresponding plane for every sample
    jsonInput.samples.map(function (sample) {
        sample.planeTypes = {}

        parameters.map(function (parameter) { //for example parameter = "noise-level"
            var value = sample[parameter]
            sample[parameter] = []
            planes.map(function (plane) {
                var difference = (plane[parameter] - value) * (plane[parameter] - value)
                sample[parameter].push({"type": plane.type, "difference": difference})
            })

            //sort the values from the lowest difference
            sortByKey(sample[parameter], "difference")

            //add the planeTypes and their positions based on the differences to the sample
            sample[parameter].map(function (onePlane, index) {
                if (typeof sample.planeTypes[onePlane.type] === "undefined") {
                    sample.planeTypes[onePlane.type] = 0
                }
                sample.planeTypes[onePlane.type] += index
            })
        })

        //get the plane with the lowest differences
        /*TODO: doesn't deal with the problem that there could be the same value for both of the planes*/
        var planeType = Object.keys(sample.planeTypes).reduce(function(a, b){ return sample.planeTypes[a] > sample.planeTypes[b] ? b : a });

        resultArray.push({"id": sample.id, "type": planeType})
    })

    result = { "result" : resultArray }
    res.send(result)
})

app.listen(3000)