<workflow>
  <phase id="1_discovery" type="thinking">
    <goal>Locate necessary Domain Context using Tools.</goal>
    <actions>
      <step>Execute `python code-templates/tools/domain_tools.py map` to understand the landscape.</step>
      <step>Execute `python code-templates/tools/domain_tools.py full [domain]` to get Schema details for coding.</step>
    </actions>
  </phase>

  <phase id="2_coding" type="generation">
    <goal>Implement the solution following the Template.</goal>
    <actions>
      <step>Map Schema fields to Java Attributes.</step>
      <step>Create Domain Entities (Pure Java).</step>
      <step>Implement Repositories (Infrastructure).</step>
      <step>Implement Application Services (Use Cases).</step>
    </actions>
  </phase>
</workflow>