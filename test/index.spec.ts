import { DepGraph, DepGraphCycleError } from "../src/index.js";
import { describe, test, expect } from "vitest";

describe("DepGraph", function () {
  test("should be able to add/remove nodes", function () {
    const graph = new DepGraph();

    graph.addNode("Foo");
    graph.addNode("Bar");

    expect(graph.hasNode("Foo")).toEqual(true);
    expect(graph.hasNode("Bar")).toEqual(true);
    expect(graph.hasNode("NotThere")).toEqual(false);

    graph.removeNode("Bar");

    expect(graph.hasNode("Bar")).toEqual(false);
  });

  test("should calculate its size", function () {
    const graph = new DepGraph();

    expect(graph.size()).toBe(0);

    graph.addNode("Foo");
    graph.addNode("Bar");

    expect(graph.size()).toBe(2);

    graph.removeNode("Bar");

    expect(graph.size()).toBe(1);
  });

  test("should treat the node data parameter as optional and use the node name as data if node data was not given", function () {
    const graph = new DepGraph();

    graph.addNode("Foo");

    expect(graph.getNodeData("Foo")).toBe("Foo");
  });

  test("should be able to associate a node name with data on node add", function () {
    const graph = new DepGraph();

    graph.addNode("Foo", "data");

    expect(graph.getNodeData("Foo")).toBe("data");
  });

  test("should be able to add undefined as node data", function () {
    const graph = new DepGraph();

    graph.addNode("Foo", undefined);

    expect(graph.getNodeData("Foo")).toBeUndefined();
  });

  test("should return true when using hasNode with a node which has falsy data", function () {
    const graph = new DepGraph();

    const falsyData = ["", 0, null, undefined, false];
    graph.addNode("Foo");

    falsyData.forEach(function (data) {
      graph.setNodeData("Foo", data);

      expect(graph.hasNode("Foo")).toEqual(true);

      // Just an extra check to make sure that the saved data is correct
      expect(graph.getNodeData("Foo")).toBe(data);
    });
  });

  test("should be able to set data after a node was added", function () {
    const graph = new DepGraph();

    graph.addNode("Foo", "data");
    graph.setNodeData("Foo", "data2");

    expect(graph.getNodeData("Foo")).toBe("data2");
  });

  test("should throw an error if we try to set data for a non-existing node", function () {
    const graph = new DepGraph();

    expect(function () {
      graph.setNodeData("Foo", "data");
    }).toThrow(new Error("Node does not exist: Foo"));
  });

  test("should throw an error if the node does not exists and we try to get data", function () {
    const graph = new DepGraph();

    expect(function () {
      graph.getNodeData("Foo");
    }).toThrow(new Error("Node does not exist: Foo"));
  });

  test("should do nothing if creating a node that already exists", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");

    graph.addDependency("a", "b");

    graph.addNode("a");

    expect(graph.dependenciesOf("a")).toEqual(["b"]);
  });

  test("should do nothing if removing a node that does not exist", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    expect(graph.hasNode("a")).toEqual(true);

    graph.removeNode("a");
    expect(graph.hasNode("Foo")).toEqual(false);

    graph.removeNode("a");
    expect(graph.hasNode("Foo")).toEqual(false);
  });

  test("should be able to add dependencies between nodes", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");

    graph.addDependency("a", "b");
    graph.addDependency("a", "c");

    expect(graph.dependenciesOf("a")).toEqual(["b", "c"]);
  });

  test("should find entry nodes", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");

    graph.addDependency("a", "b");
    graph.addDependency("a", "c");

    expect(graph.entryNodes()).toEqual(["a"]);
  });

  test("should throw an error if a node does not exist and a dependency is added", function () {
    const graph = new DepGraph();

    graph.addNode("a");

    expect(function () {
      graph.addDependency("a", "b");
    }).toThrow(new Error("Node does not exist: b"));
  });

  test("should detect cycles", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");

    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("c", "a");
    graph.addDependency("d", "a");

    expect(function () {
      graph.dependenciesOf("b");
    }).toThrow(new DepGraphCycleError(["b", "c", "a", "b"]));
  });

  test("should allow cycles when configured", function () {
    const graph = new DepGraph({ circular: true });

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");

    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("c", "a");
    graph.addDependency("d", "a");

    expect(graph.dependenciesOf("b")).toEqual(["a", "c"]);
    expect(graph.overallOrder()).toEqual(["c", "b", "a", "d"]);
  });

  test(
    "should include all nodes in overall order even from " +
      "cycles in disconnected subgraphs when circular is true",
    function () {
      const graph = new DepGraph({ circular: true });

      graph.addNode("2a");
      graph.addNode("2b");
      graph.addNode("2c");
      graph.addDependency("2a", "2b");
      graph.addDependency("2b", "2c");
      graph.addDependency("2c", "2a");

      graph.addNode("1a");
      graph.addNode("1b");
      graph.addNode("1c");
      graph.addNode("1d");
      graph.addNode("1e");

      graph.addDependency("1a", "1b");
      graph.addDependency("1a", "1c");
      graph.addDependency("1b", "1c");
      graph.addDependency("1c", "1d");

      expect(graph.overallOrder()).toEqual([
        "1d",
        "1c",
        "1b",
        "1a",
        "1e",
        "2c",
        "2b",
        "2a",
      ]);
    }
  );

  test("should detect cycles in overall order", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");

    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("c", "a");
    graph.addDependency("d", "a");

    expect(function () {
      graph.overallOrder();
    }).toThrow(new DepGraphCycleError(["a", "b", "c", "a"]));
  });

  test("should detect cycles in overall order when all nodes have dependants (incoming edges)", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");

    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("c", "a");

    expect(function () {
      graph.overallOrder();
    }).toThrow(new DepGraphCycleError(["a", "b", "c", "a"]));
  });

  test(
    "should detect cycles in overall order when there are several " +
      "disconnected subgraphs (with one that does not have a cycle",
    function () {
      const graph = new DepGraph();

      graph.addNode("a_1");
      graph.addNode("a_2");
      graph.addNode("b_1");
      graph.addNode("b_2");
      graph.addNode("b_3");

      graph.addDependency("a_1", "a_2");
      graph.addDependency("b_1", "b_2");
      graph.addDependency("b_2", "b_3");
      graph.addDependency("b_3", "b_1");

      expect(function () {
        graph.overallOrder();
      }).toThrow(new DepGraphCycleError(["b_1", "b_2", "b_3", "b_1"]));
    }
  );

  test("should retrieve dependencies and dependants in the correct order", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");

    graph.addDependency("a", "d");
    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("d", "b");

    expect(graph.dependenciesOf("a")).toEqual(["c", "b", "d"]);
    expect(graph.dependenciesOf("b")).toEqual(["c"]);
    expect(graph.dependenciesOf("c")).toEqual([]);
    expect(graph.dependenciesOf("d")).toEqual(["c", "b"]);

    expect(graph.dependantsOf("a")).toEqual([]);
    expect(graph.dependantsOf("b")).toEqual(["a", "d"]);
    expect(graph.dependantsOf("c")).toEqual(["a", "d", "b"]);
    expect(graph.dependantsOf("d")).toEqual(["a"]);

    // check the alias "dependentsOf"
    expect(graph.dependentsOf("a")).toEqual([]);
    expect(graph.dependentsOf("b")).toEqual(["a", "d"]);
    expect(graph.dependentsOf("c")).toEqual(["a", "d", "b"]);
    expect(graph.dependentsOf("d")).toEqual(["a"]);
  });

  test("should be able to retrieve direct dependencies/dependants", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");

    graph.addDependency("a", "d");
    graph.addDependency("a", "b");
    graph.addDependency("b", "c");
    graph.addDependency("d", "b");

    expect(graph.directDependenciesOf("a")).toEqual(["d", "b"]);
    expect(graph.directDependenciesOf("b")).toEqual(["c"]);
    expect(graph.directDependenciesOf("c")).toEqual([]);
    expect(graph.directDependenciesOf("d")).toEqual(["b"]);

    expect(graph.directDependantsOf("a")).toEqual([]);
    expect(graph.directDependantsOf("b")).toEqual(["a", "d"]);
    expect(graph.directDependantsOf("c")).toEqual(["b"]);
    expect(graph.directDependantsOf("d")).toEqual(["a"]);

    // check the alias "directDependentsOf"
    expect(graph.directDependentsOf("a")).toEqual([]);
    expect(graph.directDependentsOf("b")).toEqual(["a", "d"]);
    expect(graph.directDependentsOf("c")).toEqual(["b"]);
    expect(graph.directDependentsOf("d")).toEqual(["a"]);
  });

  test("should be able to resolve the overall order of things", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");
    graph.addNode("e");

    graph.addDependency("a", "b");
    graph.addDependency("a", "c");
    graph.addDependency("b", "c");
    graph.addDependency("c", "d");

    expect(graph.overallOrder()).toEqual(["d", "c", "b", "a", "e"]);
  });

  test('should be able to only retrieve the "leaves" in the overall order', function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addNode("d");
    graph.addNode("e");

    graph.addDependency("a", "b");
    graph.addDependency("a", "c");
    graph.addDependency("b", "c");
    graph.addDependency("c", "d");

    expect(graph.overallOrder(true)).toEqual(["d", "e"]);
  });

  test("should be able to give the overall order for a graph with several disconnected subgraphs", function () {
    const graph = new DepGraph();

    graph.addNode("a_1");
    graph.addNode("a_2");
    graph.addNode("b_1");
    graph.addNode("b_2");
    graph.addNode("b_3");

    graph.addDependency("a_1", "a_2");
    graph.addDependency("b_1", "b_2");
    graph.addDependency("b_2", "b_3");

    expect(graph.overallOrder()).toEqual(["a_2", "a_1", "b_3", "b_2", "b_1"]);
  });

  test("should give an empty overall order for an empty graph", function () {
    const graph = new DepGraph();

    expect(graph.overallOrder()).toEqual([]);
  });

  test("should still work after nodes are removed", function () {
    const graph = new DepGraph();

    graph.addNode("a");
    graph.addNode("b");
    graph.addNode("c");
    graph.addDependency("a", "b");
    graph.addDependency("b", "c");

    expect(graph.dependenciesOf("a")).toEqual(["c", "b"]);

    graph.removeNode("c");

    expect(graph.dependenciesOf("a")).toEqual(["b"]);
  });
});

describe("DepGraph Performance", function () {
  test("should not exceed max call stack with a very deep graph", function () {
    const g = new DepGraph();
    const expected: string[] = [];
    for (let i = 0; i < 100000; i++) {
      const istr = i.toString();
      g.addNode(istr);
      expected.push(istr);
      if (i > 0) {
        g.addDependency(istr, (i - 1).toString());
      }
    }
    const order = g.overallOrder();
    expect(order).toEqual(expected);
  });

  test("should run an a reasonable amount of time for a very large graph", function () {
    const randInt = function (min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const g = new DepGraph();
    const nodes: string[] = [];
    // Create a graph with 100000 nodes in it with 10 random connections to
    // lower numbered nodes
    for (let i = 0; i < 100000; i++) {
      nodes.push(i.toString());
      g.addNode(i.toString());
      for (let j = 0; j < 10; j++) {
        const dep = randInt(0, i);
        if (i !== dep) {
          g.addDependency(i.toString(), dep.toString());
        }
      }
    }
    const start = new Date().getTime();
    g.overallOrder();
    const end = new Date().getTime();
    expect(start - end).toBeLessThan(1000);
  });
});

describe("DepGraphCycleError", function () {
  test("should have a message", function () {
    const err = new DepGraphCycleError(["a", "b", "c", "a"]);
    expect(err.message).toEqual("Dependency Cycle Found: a -> b -> c -> a");
  });

  test("should be an instanceof DepGraphCycleError", function () {
    const err = new DepGraphCycleError(["a", "b", "c", "a"]);
    expect(err instanceof DepGraphCycleError).toEqual(true);
    expect(err instanceof Error).toEqual(true);
  });

  test("should have a cyclePath", function () {
    const cyclePath = ["a", "b", "c", "a"];
    const err = new DepGraphCycleError(cyclePath);
    expect(err.cyclePath).toEqual(cyclePath);
  });
});
