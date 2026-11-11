# Temporary shortcuts

## TS-001: developer-supplied marker calibration
- What: markerCornersPx (TL, TR, BR, BL pixel coordinates) and markerSizeCm are developer-only temporary multipart inputs. They are not the permanent user registration flow.
- Why temporary: automatic Borsal marker detection does not exist yet.
- Where: src/routes/fabrics.js calibrationShape, from-photo and analyze-photo; src/vision/extractContour.js consumes the supplied calibration. Both photo responses include devNotice; analysis.calibrationSource is manual-dev.
- Remove when: automatic Borsal marker detection exists and is validated; then populate calibration server-side using auto-marker.

## TS-002: manual creation without a photo
- What: POST /api/fabrics creates metadata-only records for development and tests only. Normal registration uses POST /api/fabrics/from-photo without a database ID.
- Why temporary: existing tests and development workflows still need manual records.
- Where: src/routes/fabrics.js createFabricPieceSchema and POST /.
- Remove or restrict when: the registration workflow replaces developer-only creation. Currently this is documented intent, not access enforcement.

## TS-003: no authentication
- What: all endpoints are open.
- Why temporary: this phase is backend MVP development.
- Where: src/app.js and src/routes/fabrics.js have no authentication middleware.
- Remove when: before approval, inventory, and reservations phases; introduce access controls first.
