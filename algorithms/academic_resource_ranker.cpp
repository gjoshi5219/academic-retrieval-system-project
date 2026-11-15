#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

class AcademicResource {
public:
    std::string title;
    int priority;
    long long uploadedAt;

    AcademicResource(std::string title, int priority, long long uploadedAt)
        : title(std::move(title)), priority(priority), uploadedAt(uploadedAt) {}
};

class AcademicResourceRanker {
    struct LowerPriority {
        bool operator()(const AcademicResource& a, const AcademicResource& b) const {
            if (a.priority != b.priority) return a.priority < b.priority;
            return a.uploadedAt < b.uploadedAt;
        }
    };

public:
    std::vector<AcademicResource> rank(std::vector<AcademicResource> resources) const {
        std::priority_queue<AcademicResource, std::vector<AcademicResource>, LowerPriority> queue;
        for (const auto& resource : resources) queue.push(resource);
        std::vector<AcademicResource> ranked;
        ranked.reserve(resources.size());
        while (!queue.empty()) {
            ranked.push_back(queue.top());
            queue.pop();
        }
        return ranked;
    }
};

#ifdef DEMO
int main() {
    AcademicResourceRanker ranker;
    const auto ranked = ranker.rank({
        {"Lecture 4", 4, 100}, {"Exam review", 10, 200}, {"Practice set", 8, 150}
    });
    for (const auto& resource : ranked) std::cout << resource.priority << "  " << resource.title << '\n';
}
#endif
