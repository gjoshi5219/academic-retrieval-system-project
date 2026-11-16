Aditya – academic_records.cpp


#include <iostream>
#include <vector>
using namespace std;

struct Resource {
    int id;
    string subject;
    string topic;
    string fileName;
    int priority;
};

class AcademicRecords {
private:
    vector<Resource> resources;

public:
    void addResource(int id, string subject, string topic,
                     string fileName, int priority) {
        Resource r = {id, subject, topic, fileName, priority};
        resources.push_back(r);
        cout << "Resource added successfully!\n";
    }

    void displayResources() {
        for (const auto& r : resources) {
            cout << "\nID: " << r.id;
            cout << "\nSubject: " << r.subject;
            cout << "\nTopic: " << r.topic;
            cout << "\nFile: " << r.fileName;
            cout << "\nPriority: " << r.priority << "\n";
        }
    }
};

int main() {
    AcademicRecords records;

    records.addResource(101, "DSA", "Trees", "trees.pdf", 3);
    records.addResource(102, "C++", "OOP", "oops.pdf", 2);

    records.displayResources();

    return 0;
}








2. Tanish – search_sort.cpp


#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Resource {
    int id;
    string subject;
    string topic;
    int priority;
};

void searchResource(vector<Resource>& resources, string key) {
    bool found = false;

    for (const auto& r : resources) {
        if (r.subject == key || r.topic == key) {
            cout << "\nResource Found!";
            cout << "\nID: " << r.id;
            cout << "\nSubject: " << r.subject;
            cout << "\nTopic: " << r.topic << "\n";
            found = true;
        }
    }

    if (!found)
        cout << "Resource not found!\n";
}

void sortResources(vector<Resource>& resources) {
    sort(resources.begin(), resources.end(),
         [](const Resource& a, const Resource& b) {
             return a.priority > b.priority;
         });

    cout << "\nResources Sorted By Priority:\n";

    for (const auto& r : resources) {
        cout << r.id << " | "
             << r.subject << " | "
             << r.topic << " | Priority: "
             << r.priority << "\n";
    }
}

int main() {
    vector<Resource> resources = {
        {101, "DSA", "Trees", 3},
        {102, "C++", "OOP", 5},
        {103, "DBMS", "SQL", 2}
    };

    searchResource(resources, "DSA");
    sortResources(resources);

    return 0;
}







Gaurav – priority_queue.cpp

#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct Resource {
    int id;
    string subject;
    string topic;
    int priority;
};

struct Compare {
    bool operator()(const Resource& a, const Resource& b) {
        if (a.priority == b.priority)
            return a.id > b.id;

        return a.priority < b.priority;
    }
};

int main() {
    priority_queue<Resource, vector<Resource>, Compare> pq;

    pq.push({101, "DSA", "Trees", 3});
    pq.push({102, "C++", "OOP", 5});
    pq.push({103, "DBMS", "SQL", 2});
    pq.push({104, "DSA", "Graphs", 5});

    cout << "Resources According To Priority:\n";

    while (!pq.empty()) {
        Resource r = pq.top();

        cout << "\nID: " << r.id;
        cout << "\nSubject: " << r.subject;
        cout << "\nTopic: " << r.topic;
        cout << "\nPriority: " << r.priority << "\n";

        pq.pop();
    }

    return 0;
}







Mayank – graph.cpp


#include <iostream>
#include <vector>
#include <queue>
using namespace std;

class Graph {
private:
    int vertices;
    vector<vector<int>> adj;

public:
    Graph(int v) {
        vertices = v;
        adj.resize(v);
    }

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    void BFS(int start) {
        vector<bool> visited(vertices, false);
        queue<int> q;

        visited[start] = true;
        q.push(start);

        cout << "\nBFS Traversal: ";

        while (!q.empty()) {
            int node = q.front();
            q.pop();

            cout << node << " ";

            for (int neighbour : adj[node]) {
                if (!visited[neighbour]) {
                    visited[neighbour] = true;
                    q.push(neighbour);
                }
            }
        }
    }

    void DFSUtil(int node, vector<bool>& visited) {
        visited[node] = true;
        cout << node << " ";

        for (int neighbour : adj[node]) {
            if (!visited[neighbour]) {
                DFSUtil(neighbour, visited);
            }
        }
    }

    void DFS(int start) {
        vector<bool> visited(vertices, false);

        cout << "\nDFS Traversal: ";
        DFSUtil(start, visited);
    }
};

int main() {
    Graph g(5);

    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(2, 4);

    g.BFS(0);
    g.DFS(0);

    return 0;
}
