# Aggregator Service Template (Java)

**Use Case**: Dashboard, Reports, or any API that needs to stitch data from multiple tables/repositories.

## Structure

### 1. The VO (View Object)
Pure data container for the frontend.
```java
public class __ModuleName__StatsVO {
    private String id;
    private Long totalCount;
    private Long todayCount;
    // ...
}
```

### 2. The Service Implementation
Responsibilities:
1.  **Fetch**: Call multiple repositories (UserRepo, OrgRepo, EventRepo).
2.  **Assemble**: Combine data in-memory (avoid N+1 loops using Maps).
3.  **Calculate**: Perform business math.

```java
@Service
public class __ModuleName__ServiceImpl implements __ModuleName__Service {

    @Autowired private RepoA repoA;
    @Autowired private RepoB repoB;

    @Override
    public List<__ModuleName__StatsVO> getStats() {
        // 1. Fetch Raw Data
        List<EntityA> listA = repoA.findAll();

        // 2. Batch Fetch Related Data (Optimization)
        Set<String> ids = listA.stream().map(EntityA::getId).collect(Collectors.toSet());
        Map<String, EntityB> mapB = repoB.findByIds(ids);

        // 3. Assemble
        return listA.stream().map(item -> {
            EntityB related = mapB.get(item.getId());
            return new __ModuleName__StatsVO(item, related);
        }).collect(Collectors.toList());
    }
}
```
