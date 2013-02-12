
function debug(obj)
{
    if (window.console) {
	console.log(obj);
    }
}

// point = (number,number)
function makePoint(x,y) {
    return new Array(x,y);
}

function xOf(pt) {
    return pt[0];
}

function yOf(pt) {
    return pt[1];
}

// Unit-Interval: [0,1]
// Curve, Unit-Interval --> point

function unitCircle(t) {
    return makePoint(Math.sin(2*Math.PI*t),Math.cos(2*Math.PI*t));
}

function unitLineAt(y) {
    return function (t) {
	return makePoint(t,y);
    }
}

unitLine = unitLineAt(0);

// Curve-Transform: (Curve --> Curve)

// rotate curve 1/2 PI in anti-clock wise
function rotateHalfPI(curve) {
    return function (t) {
	ct = curve(t);
	makePoint(-yOf(ct),xOf(ct));
    }
}

// Constructor of Curve-Transform
// rotateAroundOrigin is of type (theta --> Curve-Transform)
function rotateAroundOrigin(theta) {
    var cth = Math.cos(theta);
    var sth = Math.sin(theta);

    return function (curve) {
	return function (t) {
	    ct = curve(t);
	    x = xOf(ct);
	    y = yOf(ct);
	    return makePoint(cth*x - sth*y, sth*x+cth*y);
	}
    }
}

function translate(x0,y0) {
    return function (curve) {
	return function (t) {
	    ct = curve(t);
	    return makePoint(xOf(ct)+x0,yOf(ct)+y0);
	}
    }
}

function scaleXY(a,b) {
    return function (curve) {
	return function (t) {
	    ct = curve(t);
	    return makePoint(xOf(ct)*a,yOf(ct)*b);
	}
    }
}

// f and g's type is T --> T
function compose(f,g) {
    return function (x) {
	return f(g(x));
    }
}




// returns Curve-Transform
// translate and scale a curve
// so the portion of the curve in the rectangle
// with corners xlo1 xhi1 ylo1 yhi1 will appear in
// rectangle    xlo2 xhi2 ylo2 yhi2
function translateRectangularPortion(xlo1,xhi1,ylo1,yhi1,xlo2,xhi2,ylo2,yhi2) {
    return compose(scaleXY((xhi1-xlo1)==0?0:(xhi2-xlo2)*1.0/(xhi1-xlo1),
			   (yhi1-ylo1)==0?0:(yhi2-ylo2)*1.0/(yhi1-ylo1)),
		   translate(xlo2-xlo1,ylo2-ylo1));
}

// returns Curve-Transform
// translate and scale a curve
// so the portion of the curve in the rectangle
// with corners xlo xhi ylo yhi will appear in a display window
// which has x, y coordinates from 0 to 1.
// e.g. curve c is in rectangle (xlo,xhi,ylo,yhi)
//      squeezeRectangularPortion(xlo,xhi,ylo,yhi)(c) returns a new curve
//      which is in rectangle(0,1,0,1)
function squeezeRectangularPortion(xlo,xhi,ylo,yhi) {
    return translateRectangularPortion(xlo,xhi,ylo,yhi,0,1,0,1);
}

function putInStandardPosition(curve) {
    var start = curve(0);
    var curveStartedAtOrigin = translate(-xOf(start),-yOf(start))(curve);
    var newEndPoint = curveStartedAtOrigin(1);
    var theta = Math.atan( yOf(end)*1.0 / xOf(end));
    var curveEndedAtXAxis = rotateAroundOrigin(-theta)(curveStartedAtOrigin);
    var endPointOnXAxis = curveEndedAtAxis(1);
    return scale(1.0/xOf(endPointOnXAxis))(curveEndedAtAxis);
}

// Binary transform

function connectRigidly(curve1, curve2) {
    return function (t) {
	if (t<0.5) {
	    return curve1(2*t);
	} else {
	    return curve2(2*t - 1);
	}
    }
}

function connectEnds(curve1,curve2) {
    var curve1EndPoint = curve1(1);
    var curve2StartPoint = curve2(0);
    return connectRigidly(curve1,
			  translate(xOf(curve1EndPoint)-xOf(curve2StartPoint),
				    yOf(curve1EndPoint)-yOf(curve2StartPoint))(curve2));
}

function identity(x)
{
    return x;
}

// repeat apply function f, n times
function repeated(f,n) {
    if (n<=0) {
	return identity;
    } else {
	return function (t) {
	    return f(repeated(f,n-1)(t));
	}
    }
}

function scale(size)
{
    return scaleXY(size,size);
}

// The default canvas's coordinate origin point is at left upper
// change it to left bottom
function coordinateNormalize(c) {
    return function (curve) {
	return function (t) {
	    pt = curve(t);
	    return makePoint(xOf(pt),c.height - yOf(pt));
	}
    }
}

// The drawing procedure takes a curve and automagically draw curve on the window
// provides several functions to return a drawing procedure
function drawPoints(c,pointsNum) {
    var coordNormalizer = coordinateNormalize(c);
    return function (curve) {
	drawPointsInContext(coordNormalizer(curve),c.getContext("2d"),pointsNum);
    }
}

function drawPointsInContext(curve,cxt,pointsNum)
{
    var x = 1.0 / pointsNum;
    for (var t=0; t<=1; t+=x) {
	pt = curve(t);
	if (t==0) {
	    cxt.moveTo(xOf(pt),yOf(pt));
	} else {
	    cxt.lineTo(xOf(pt),yOf(pt));
	}
    }

    cxt.strokeStyle="red";
    cxt.stroke()
}

function logCurve(curve)
{
    var x = 1.0 / 50;
    for (var t=0; t<=1; t+=x) {
	debug(curve(t));
    }
}

// calculate the rectangle enclosing the curve
function closestRectangle(curve) {

    var x = 1.0 / 1000;
    var origin = curve(0);
    var xlo,xhi,ylo,yhi;
    xlo = xhi = xOf(origin);
    ylo = yhi = yOf(origin);
	
    for (var t=0; t<=1; t+=x) {
	pt = curve(t);
	if (xOf(pt)<xlo) {
	    xlo = xOf(pt);
	} else if (xOf(pt)>xhi) {
	    xhi = xOf(pt);
	}
	if (yOf(pt)<ylo) {
	    ylo = yOf(pt);
	} else if (yOf(pt)>yhi) {
	    yhi = yOf(pt);
	}
    }

    return {xlo:xlo,xhi:xhi>xlo?xhi:xlo+1,ylo:ylo,yhi:yhi>ylo?yhi:ylo+1};
}

    
function clearCanvas(c) 
{
    $(c).width = $(c).width;
}

// return a function: draw curve using the specified number of points
// within canvas's rectangle
function drawPointsWithinRectangle(c,pointsNum) {

    var coordNormalizer = coordinateNormalize(c);
    // Calculate the rectangle closest to curve
    // Then scale the curve
    return function (curve) {
	curve1 = coordNormalizer(curve);
	rect = closestRectangle(curve1);
	curve2 = translateRectangularPortion(rect.xlo,rect.xhi,rect.ylo,rect.yhi,0,c.width-1,0,c.height-1)(curve1);
	drawPointsInContext(curve2, c.getContext("2d"), pointsNum);
    }
}

// lib Usage example:
function gosperize(curve) {
    var scaledCurve = scale(Math.sqrt(2.0)/2.0)(curve);
    return connectRigidly(rotateAroundOrigin(Math.PI/4)(scaledCurve),
			  translate(0.5,0.5)(rotateAroundOrigin(-Math.PI/4)(scaledCurve)));
}

function gosperCurve(level) {
    return repeated(gosperize,level)(unitLine);
}


