import {
  rewire$asyncGetEntry as getEntryRewire,
  restore as getEntryRestore
} from "../../src/lib/resource-timing";

import Lib from "../../src/tasks/fetch/index.js";
import testId from "../../src/lib/unique-id";
import resourceFixture from "../fixtures/resource-timing-entry";

const fixture = {
  id: "test",
  type: "fetch",
  host: "test.com"
};

describe("Fetch", () => {
  let task;
  let mock;

  before(() => {
    mock = fetchMock.get({
      name: "object-host",
      method: "get",
      response: {
        body: "",
        headers: {
          "X-Datacenter": "LHR"
        }
      },
      matcher: new RegExp(fixture.host)
    });
    getEntryRewire(() => Promise.resolve(resourceFixture));
  });

  beforeEach(() => {
    task = new Lib(fixture);
  });

  afterEach(() => {
    task = null;
    mock.reset();
  });

  after(() => {
    fetchMock.restore();
    getEntryRestore();
  });

  it("should be a class", () => {
    expect(Lib).to.be.an("function");
    expect(new Lib(fixture)).to.be.an.instanceOf(Lib);
  });

  it("should make fetch request to provided hostname", () =>
    task.run().then(() => {
      expect(mock.done("object-host")).to.be.true;
    }));

  it("should ensure request is unique", () =>
    task.run().then(() => {
      const call = mock.lastCall("object-host")[0];
      expect(call).to.contain(testId);
    }));

  it("should return the resource timing data for the request", () =>
    task.run().then(({ subject_fetch_start }) => {
      expect(subject_fetch_start).to.be.an("number");
    }));

  it("should return the subject_id from the response", () =>
    task.run().then(({ subject_id }) => {
      expect(subject_id).to.equal("LHR");
      expect(subject_id).to.not.equal(fixture.id);
    }));
});
