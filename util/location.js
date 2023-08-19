const axios = require("axios");

const HttpError = require("../models/http-error");

const API_KEY = process.env.LOCATION_API_KEY;

const getCoordsForAddress = async (address) => {
  // default
  // return {
  //   lat:40.7484474,
  //   lng: -73.9871516
  // }
  const response = await axios.get(
    `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(
      address
    )}&format=json`
  );

  const data = response.data[0];

  // console.log(data);

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specified address.",
      422
    );
    return next(error);
  }

  const coorLat = data.lat;
  const coorLon = data.lon;
  const coordinates = {
    lat: coorLat,
    lng: coorLon,
  };

  return coordinates;
};

module.exports = getCoordsForAddress;
