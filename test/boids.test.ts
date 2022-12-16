import {sampleFunction} from '../src/client/boid/boid'

describe("this is pretty simple", () => {
    test("Check the sampleFunction function", () => {
        expect(sampleFunction("hello")).toEqual("hellohello");
    });
});