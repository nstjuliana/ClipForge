# Development Phases

**Iterative development plan for ClipForge**

This directory contains the phase-by-phase development plan for building ClipForge from barebones setup to polished, submission-ready application.

---

## Phase Overview

### [Phase 0: Setup](./phase-0-setup.md) ⚙️
**Duration**: 4-6 hours  
**Goal**: Get Electron + React + TypeScript foundation running

**Deliverables**:
- Electron app launches with window
- React rendering in Electron
- Basic navigation between screens
- TypeScript configured
- Development environment ready

### [Phase 1: MVP](./phase-1-mvp.md) 🎯
**Duration**: 12-16 hours  
**Goal**: Implement all MVP requirements  
**HARD GATE**: Tuesday, October 28th at 10:59 PM CT

**Deliverables**:
- Video import (drag & drop or file picker)
- Timeline view with clips
- Video preview player
- Trim functionality
- Export to MP4
- Packaged as native app

### [Phase 2: Core Features](./phase-2-core-features.md) 🚀
**Duration**: 10-14 hours  
**Goal**: Add recording, split, multiple tracks, zoom/pan

**Deliverables**:
- Screen and webcam recording
- Split clips at playhead
- Multiple timeline tracks
- Timeline zoom and pan
- Advanced preview controls
- Better error handling

### [Phase 3: Polish](./phase-3-polish.md) ✨
**Duration**: 6-8 hours  
**Goal**: UI/UX improvements and final submission preparation

**Deliverables**:
- Welcome screen (post-MVP)
- Enhanced visual design
- Keyboard shortcuts
- Performance optimizations
- Comprehensive documentation
- Submission-ready build

---

## Total Timeline

**Estimated Total**: 32-44 hours over 72-hour sprint

**Recommended Distribution**:
- **Day 1** (8-10 hours): Phase 0 + Start Phase 1
- **Day 2** (10-12 hours): Complete Phase 1 (MVP), start Phase 2
- **Day 3** (10-12 hours): Complete Phase 2, Phase 3 (Polish), final submission

---

## Development Strategy

### Phase Priority
1. **Phase 1 (MVP) is HARD GATE** - Must be completed by Tuesday 10:59 PM CT
2. **Phase 0 must be completed first** - Foundation for everything else
3. **Phase 2 adds value** - Important features beyond MVP
4. **Phase 3 is polish** - Only if time permits

### Sprint Approach
- Focus on MVP first - get working export
- Add recording if time allows (Phase 2)
- Polish only if core features are stable
- Don't over-engineer - ship something

### Risk Management
- **FFmpeg can be tricky** - Test export early (Phase 1)
- **Recording permissions** - Test on actual hardware
- **Packaging issues** - Build packaged app before submission deadline
- **Timeline rendering** - Don't get stuck on Konva, use simpler approach if needed

---

## Working Through Phases

### Getting Started
1. Start with **Phase 0: Setup**
2. Follow tasks in order within each phase
3. Complete acceptance criteria before moving to next phase
4. Test frequently - don't wait until end

### Each Phase Document Includes:
- **Detailed tasks** with actionable steps (max 5 steps per feature)
- **Code examples** showing expected structure
- **Acceptance criteria** - checklist to verify completion
- **Common issues** - troubleshooting tips
- **Success criteria** - what "done" looks like

### Checking Progress
After completing a phase, review:
- ✅ All acceptance criteria met
- ✅ No critical bugs
- ✅ Tests pass
- ✅ Ready to move to next phase

---

## Key Success Metrics

### Must-Have (MVP)
- [ ] App launches and packages successfully
- [ ] Can import video files
- [ ] Can add clips to timeline
- [ ] Can trim clips
- [ ] Can export to MP4
- [ ] App works in packaged form

### Should-Have (Core Features)
- [ ] Can record screen/webcam
- [ ] Can split clips
- [ ] Timeline has multiple tracks
- [ ] Zoom and pan work

### Nice-to-Have (Polish)
- [ ] Welcome screen
- [ ] Keyboard shortcuts
- [ ] Smooth animations
- [ ] Comprehensive documentation

---

## Emergency Fallbacks

### If Running Behind Schedule
1. **Phase 0**: Cut to absolute minimum (just get Electron + React working)
2. **Phase 1**: Focus ONLY on import → trim → export (skip project save/load if needed)
3. **Phase 2**: Skip recording, focus on timeline improvements
4. **Phase 3**: Skip all polish, focus on fixing critical bugs

### If Blocked on Feature
- **Alternative approaches**: Check tech-stack.md for fallback libraries
- **Simplify**: Don't get stuck on perfect implementation
- **Move on**: Return to blocked feature later if time allows
- **Ship MVP**: Working simple version > broken complex version

---

## Next Steps

1. **Read Phase 0 document** thoroughly
2. **Set up development environment**
3. **Begin Phase 0 tasks**
4. **Track progress** against acceptance criteria
5. **Complete each phase** before moving to next

---

**Remember**: MVP is the hard gate. Focus on getting a working video editor that can import, trim, and export. Everything else is bonus.

**Ship before you relocate to Austin on Thursday.**

